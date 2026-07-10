---
sidebar_position: 17
title: Plugins & Application Mounts
description: Extend JSS with whole applications — where the plugin system stands and how to use it today
---

# Plugins & Application Mounts

JSS can host entire applications beside your pod — same origin, same server,
with the pod's identity system as the app's login. This page covers what
works **today** (v0.0.213+), how to build on it, and where the full plugin
system is headed.

:::tip The one-line version
`createServer({ appPaths: ['/myapp'] })` mounts an application under a URL
prefix. The app owns everything below its prefix; the pod keeps everything
else. Your WebID can be the app's account — no separate passwords.
:::

## Status at a glance

| Piece | Status | Where |
|---|---|---|
| Application mount points (`appPaths`) | ✅ **Shipped in v0.0.213** | [#582](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/582), [#585](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/585) |
| Reference plugin ("plugin zero") | ✅ Running — [Tideholm](https://github.com/melvincarvalho/tideholm/tree/gh-pages/jss-plugin), a multiplayer game where pod WebIDs are player accounts | [#206 discussion](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/206) |
| Raw-body mode for wrapped apps | 📋 Pattern documented below; helper proposed | [#583](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/583) |
| Public identity accessor (`api.auth.getAgent`) | 📋 Works via internal import; public blessing proposed | [#584](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/584) |
| Plugin loader (manifest, discovery, policy) | 🔭 Designed, not yet built | [#206](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/206), [#564](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/564) |

## Why plugins?

JSS already *is* a plugin system internally: notifications, the IdP,
ActivityPub, the Nostr relay, MCP, remoteStorage, the tunnel — each is an
encapsulated Fastify plugin toggled by a `createServer` flag. The plugin
effort (#206) is about opening that same power to third parties **without
editing server.js**: games, dashboards, CardDAV servers, custom APIs —
anything that wants to live on your pod's origin and speak to your pod's
identity.

The strategy is deliberate: ship the smallest seam, prove it with a real
consumer, bless the API afterward. The first consumer — *plugin zero* — is
[Tideholm](https://github.com/melvincarvalho/tideholm), a zero-dependency
island-strategy game. Mounting it surfaced exactly three missing seams, of
which only one required a core change. That one shipped in v0.0.213.

## What shipped: `appPaths`

JSS authorizes every request against pod ACLs (WAC) in a global hook, and
rejects before routes run. Built-in features escape via a hardcoded list;
until v0.0.213, third-party routes couldn't. Now:

```js
import { createServer } from 'javascript-solid-server/src/server.js';

const fastify = createServer({
  root: './data/pods',
  idp: true,
  idpIssuer: 'https://pod.example',
  appPaths: ['/myapp'],          // ← the seam
});

// Register both forms — fastify wildcards don't match the bare prefix.
fastify.all('/myapp', myAppHandler);
fastify.all('/myapp/*', myAppHandler);

await fastify.listen({ port: 4443 });
```

Rules of the road:

- Requests at or below an app path **skip the WAC hook** — the app owns
  authentication *and* authorization under its prefix, exactly the deal
  `/storage/` and `/db/` have always had. Everything else keeps full WAC.
- Matching is per **path segment**: `/myapp` does not exempt
  `/myapplication`. Trailing slashes are normalized; malformed entries
  (no leading `/`, bare `/`, whitespace) are dropped, never widened.
- `request.webId` is **never set** under an app path — the WAC hook is what
  populates it. Resolve identity yourself (next section).
- Default off. No `appPaths`, no change.

## Pod identity as the app's login

The best part: your app doesn't need accounts. JSS's token verification
already handles every supported scheme uniformly — IdP Bearer tokens,
Solid-OIDC DPoP, Nostr NIP-98 signatures, LWS10-CID:

```js
import { getWebIdFromRequestAsync } from 'javascript-solid-server/src/auth/token.js';

async function myAppHandler(request, reply) {
  const { webId } = await getWebIdFromRequestAsync(request);
  if (!webId) return reply.code(401).send({ error: 'sign in with your pod' });
  // webId is a verified identity — key your app's users on it
}
```

:::caution
`getWebIdFromRequestAsync` is currently an internal import — it works, but
its path isn't a stable contract yet.
[#584](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/584)
tracks blessing it as public API (`api.auth.getAgent`).
:::

**Browser users** don't send `Authorization` headers by themselves. The
pattern proven in Tideholm: the app's login screen POSTs pod credentials to
JSS's documented [`/idp/credentials`](/docs/features/authentication)
endpoint, stores the returned Bearer token, and attaches it to the app's
API calls. Tokens expire after 3600s — handle the 401 by returning to the
login screen (or watch #584 for improvements here).

## Wrapping an existing app (raw bodies)

If your "plugin" is an existing node-style HTTP app (`(req, res)` handler),
two gotchas — both solved with one pattern:

1. Fastify's content parsers **consume request bodies** before handlers
   run, so your wrapped app hangs waiting for a stream that's been drained.
2. Fastify wants to own the response unless you tell it otherwise.

```js
await fastify.register(async (scope) => {
  // Pass bodies through untouched, scoped so the host is unaffected.
  scope.removeAllContentTypeParsers();
  scope.addContentTypeParser('*', (req, payload, done) => done(null, payload));

  const handler = async (request, reply) => {
    const { webId } = await getWebIdFromRequestAsync(request);
    request.raw.myAppWebId = webId;      // hand identity to the raw handler
    reply.hijack();                      // fastify lets go of the response
    myNodeApp.handle(request.raw, reply.raw);
  };
  scope.all('/myapp', handler);
  scope.all('/myapp/*', handler);
});
```

[#583](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/583)
proposes packaging this as `api.mountApp(prefix, nodeHandler)` so nobody
rediscovers it the hard way.

## Case study: plugin zero

[Tideholm](https://github.com/melvincarvalho/tideholm) is the working
reference for everything above — a multiplayer browser strategy game whose
core is zero-dependency and transport-agnostic, with a ~100-line adapter
([`jss-plugin/`](https://github.com/melvincarvalho/tideholm/tree/gh-pages/jss-plugin))
that mounts it at `/tideholm`:

- **WebID → player**: first authenticated request auto-provisions a game
  account keyed to the pod identity. Two pods, two players. No passwords.
- **Same origin, both worlds**: `/alice/profile/card.jsonld` (LDP + WAC)
  and `/tideholm/api/state` (game auth) serve side by side.
- **Dual mode**: the same game runs standalone (`node server.js`, its own
  password accounts) or mounted (pod identity), switching via a tiny
  `GET /api/meta` the client reads at boot.
- **Try it**: `JSS_PATH=... node jss-plugin/demo.js` runs a 12-check
  end-to-end proof; `jss-plugin/serve.js` is a persistent composed server.

The adapter also ships `jss.plugin.json` and an `activate(api)` entry —
dead code today, but shaped exactly like the coming loader contract, so it
becomes a drop-in plugin the day the loader lands.

## The road ahead

From [#206](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/206)
/ [#564](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/564),
in order:

1. **Loader** — `jss.plugin.json` manifests (`{ id, version, entry }`),
   `activate(api)` entry points, allow/deny policy, per-plugin config.
   Plugins load **only from operator config paths — never from pod
   storage** (pods are user-writable; a loader that reads them is RCE).
2. **Migrate the bundled features** onto the loader (#564) — eight
   battle-tested consumers from day one.
3. **Richer seams as consumers demand them** — `api.auth.getAgent` (#584),
   `api.mountApp` (#583), `registerMcpTool`, `registerPane`, with the
   [pane store](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/184)
   as the eventual marketplace layer.

The pattern for contributing a seam is established: build a real thing
against JSS, hit a wall, file the smallest issue that removes it, prove it
with your consumer. Plugin zero took the `appPaths` route from idea to npm
in a day — the door is open.
