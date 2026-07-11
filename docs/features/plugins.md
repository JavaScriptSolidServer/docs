---
sidebar_position: 17
title: Plugins & Application Mounts
description: Extend JSS with whole applications — where the plugin system stands and how to use it today
---

# Plugins & Application Mounts

JSS can host entire applications beside your pod — same origin, same server,
with the pod's identity system as the app's login. This page covers what
works **today** (v0.0.219+), how to build a plugin, and the seams underneath.

:::tip The one-line version
`createServer({ plugins: [{ module: 'my-app/plugin.js', prefix: '/myapp' }] })`
loads an application and mounts it under a URL prefix. The app owns
everything below its prefix; the pod keeps everything else. Your WebID can
be the app's account — no separate passwords.
:::

## Status at a glance

| Piece | Status | Where |
|---|---|---|
| **Plugin loader** (`plugins` option, `activate(api)`) | ✅ **Shipped v0.0.215** | [#206](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/206), [#589](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/589) |
| Application mount points (`appPaths`) | ✅ Shipped v0.0.213 | [#582](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/582), [#585](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/585) |
| Public identity accessor (`getAgent`) | ✅ Shipped v0.0.214 | [#584](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/584), [#586](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/586) |
| WebSocket routing (`api.ws.route`) | ✅ Shipped v0.0.215 | [#588](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/588), [#589](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/589) |
| CLI: config-file `plugins` + repeatable `--plugin module@prefix` | ✅ Shipped v0.0.216–217 | [#593](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/593), [#595](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/595) |
| Wrapping node apps (`api.mountApp`) | ✅ Shipped v0.0.217 | [#583](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/583), [#590](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/590) |
| Server origin (`api.serverInfo()`) | ✅ Shipped v0.0.218 | [#601](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/601), [#605](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/605) |
| Reserve fixed paths (`api.reservePath`) | ✅ Shipped v0.0.218 | [#602](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/602), [#607](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/607) |
| Loaded-plugin roster (`api.plugins`) | ✅ Shipped v0.0.218 | [#610](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/610), [#612](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/612) |
| Reference plugins | ✅ A [33-plugin out-of-tree suite](https://github.com/JavaScriptSolidServer/plugins) (dashboard, WebDAV/CalDAV/CardDAV, Mastodon/Bluesky/Matrix shims, S3, JMAP, …) plus [Tideholm](https://github.com/melvincarvalho/tideholm) & [bridge](https://github.com/melvincarvalho/bridge) | [plugins repo](https://github.com/JavaScriptSolidServer/plugins) |
| Bundled-feature migration; `api.events`, `api.authorize` seams; panes | 🔭 Next | [#564](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/564), [#603](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/603), [#604](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/604) |

## Using the loader

Declare your apps; the server imports, mounts, and tears them down:

```js
import { createServer } from 'javascript-solid-server/src/server.js';

const fastify = createServer({
  root: './data/pods',
  idp: true,
  idpIssuer: 'https://pod.example',
  plugins: [
    { module: 'tideholm/jss-plugin/tideholm-jss.js', prefix: '/tideholm',
      config: { bots: 8 } },
    { module: './my-app/plugin.js', prefix: '/myapp' },
  ],
});
await fastify.listen({ port: 4443 });
```

No config file? Mount the same apps from the CLI — the repeatable `--plugin`
flag takes `module[@prefix]` and appends to any config-file `plugins`
(v0.0.216–217):

```bash
jss start \
  --plugin ./relay/plugin.js@/relay \
  --plugin ./dashboard/plugin.js@/dashboard
```

A plugin module exports one function:

```js
export async function activate(api) {
  // HTTP routes — the prefix is already WAC-exempt (appPaths, below):
  api.fastify.all(api.prefix + '/api/*', async (request, reply) => {
    const agent = await api.auth.getAgent(request);   // WebID | did:nostr | null
    // ...
  });

  // Realtime — the loader owns the upgrade; you get the ready socket:
  await api.ws.route(api.prefix + '/ws', (socket, request) => {
    socket.on('message', (data) => socket.send(data));
  });

  // Private server-side storage (never served over HTTP):
  const dir = api.storage.pluginDir();

  // The server's own origin — for absolute URLs and loopback calls, so you
  // never repeat baseUrl in config. Call it per request (with port 0 the
  // real port exists only once listening):
  const { baseUrl, host, port } = api.serverInfo();              // (#601)

  // Every co-loaded plugin, read-only — enumerate your siblings instead of a
  // hand-copied list (this is how the dashboard plugin knows what to show):
  for (const { id, prefix, module } of api.plugins) { /* … */ }  // (#610)

  return { deactivate() { /* save state, clear timers */ } };
}
```

The api also carries `api.config` (the entry's config, verbatim), `api.log`
(speaks both pino and console dialects), `api.reservePath(path)` — claim and
WAC-exempt a fixed or `/:param/`-shaped route **outside** your prefix, for
protocols that pin absolute paths (`/xrpc`, `/:user/did.json`) — and
`api.mountApp(handler, { prefix })` for wrapping a node-style app (below). A
plugin that fails to import or activate **fails `listen()` loudly** — a
server silently missing an app is worse than one that refuses to start.

Entries take an optional `id` that keys `pluginDir`. It defaults to a name
derived from `module`: the file's basename, or its **parent directory** for
the conventional `<name>/plugin.js` layout (`relay/plugin.js` → `relay`), so
distinct plugins get distinct ids with none set (v0.0.219+,
[#596](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/596)).
Set it explicitly only if two specifiers still reduce to the same name.

Plugins load **only from operator config — never from pod storage** (pods
are user-writable; a loader that read them would be remote code execution).

Everything below this point is the machinery the loader assembles — worth
knowing when you're debugging, composing by hand, or targeting a pre-0.0.215
host.

## Why plugins?

JSS already *is* a plugin system internally: notifications, the IdP,
ActivityPub, the Nostr relay, MCP, remoteStorage, the tunnel — each is an
encapsulated Fastify plugin toggled by a `createServer` flag. The plugin
effort (#206) is about opening that same power to third parties **without
editing server.js**: games, dashboards, CardDAV servers, custom APIs —
anything that wants to live on your pod's origin and speak to your pod's
identity.

The strategy is deliberate: ship the smallest seam, prove it with a real
consumer, bless the API afterward. Tideholm (*plugin zero*) forced
`appPaths` (v0.0.213) and `getAgent` (v0.0.214); bridge (*plugin two*, the
first realtime app) forced `ws.route`; the loader that assembles them
shipped in v0.0.215 with both games as its test consumers.

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
import { getAgent } from 'javascript-solid-server/auth.js'; // v0.0.214+

async function myAppHandler(request, reply) {
  const agent = await getAgent(request);
  if (!agent) return reply.code(401).send({ error: 'sign in with your pod' });
  // agent is a verified identifier — key your app's users on it
}
```

`getAgent` returns the verified **agent identifier**: usually an HTTP(S)
WebID, but a `did:nostr:...` DID for NIP-98 agents without a WebID mapping —
DID agents are first-class. It covers all five credential schemes (IdP
Bearer, Solid-OIDC DPoP, Nostr NIP-98, LWS10-CID, WebID-TLS), never throws
on bad credentials, and everything under `src/` stays internal — this
import is the contract.

**Browser users** don't send `Authorization` headers by themselves. The
pattern proven in Tideholm: the app's login screen POSTs pod credentials to
JSS's documented [`/idp/credentials`](/docs/features/authentication)
endpoint, stores the returned Bearer token, and attaches it to the app's
API calls. Tokens expire after 3600s — handle the 401 by returning to the
login screen.

## Wrapping an existing app (`api.mountApp`)

If your "plugin" is an existing node-style HTTP app (`(req, res)` handler),
two gotchas bite: Fastify's content parsers **consume request bodies**
before handlers run (so a wrapped app hangs waiting for a stream that's been
drained), and Fastify wants to own the response. `api.mountApp` (v0.0.217,
[#590](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/590))
handles both — plus the `appPaths` exemption and `reply.hijack()`:

```js
export async function activate(api) {
  await api.mountApp(
    (req, res) => myNodeApp.handle(req, res),   // your (req, res) app
    { prefix: api.prefix },                     // omit to use the entry prefix
  );
}
```

The wrapped app receives the **undrained** request stream and owns the
response — including gzipped bodies, which it inflates itself. Need the
caller's identity inside it? Resolve it before handing off:
`req.agent = await api.auth.getAgent(request)`.

Under the hood it's a scoped pass-through content-type parser plus
`reply.hijack()`, registered on both the bare prefix and its subtree — the
pattern plugins rediscovered the hard way before the helper shipped
([#583](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/583)).

## Case studies: the plugins that built the system

Every seam above was forced by a real consumer before it shipped — that's
the house method, and it scaled. A
[33-plugin out-of-tree suite](https://github.com/JavaScriptSolidServer/plugins)
now exercises the whole api — a status **dashboard** that auto-discovers its
siblings via `api.plugins`, the WebDAV/CalDAV/CardDAV family, Mastodon /
Bluesky / Matrix / ActivityPub shims, an S3 gateway, JMAP mail, Micropub,
remoteStorage, and more, all on one server from pure config. Each plugin's
`README` records the seam it needed and the wall it hit — the findings that
drove `serverInfo`, `reservePath`, and `api.plugins` upstream. The two games
remain the original forcing consumers, live at
[nostr.social/tideholm](https://nostr.social/tideholm/) and
[nostr.social/bridge](https://nostr.social/bridge/):

**[Tideholm](https://github.com/melvincarvalho/tideholm)** (plugin zero —
forced `appPaths` and `getAgent`): a multiplayer island-strategy game whose
core is zero-dependency and transport-agnostic, with a ~100-line adapter at
[`jss-plugin/`](https://github.com/melvincarvalho/tideholm/tree/gh-pages/jss-plugin).

- **WebID → player**: first authenticated request auto-provisions a game
  account keyed to the pod identity. Two pods, two players. No passwords.
- **Same origin, both worlds**: `/alice/profile/card.jsonld` (LDP + WAC)
  and `/tideholm/api/state` (game auth) serve side by side.
- **Dual mode**: the same game runs standalone (`node server.js`, its own
  password accounts) or mounted (pod identity), switching via a tiny
  `GET /api/meta` the client reads at boot.

**[bridge](https://github.com/melvincarvalho/bridge)** (plugin two — forced
`ws.route`): a realtime card game, no build step, WebSocket tables. It
contributed the **ticket pattern** for WebSocket auth: the client
authenticates a normal HTTP request (`/bridge/auth/nip98`), `getAgent`
verifies it — NIP-98 signature or pod Bearer, same call — and the app mints
a one-use short-TTL ticket presented in the first socket message.
Credentials never cross the upgrade, and the host never touches the app's
socket protocol.

Both adapters export the `activate(api)` contract, so one server can run
both games from six lines of `plugins:` config — one pod account is a
Tideholm player and a bridge seat with a single sign-in.

## The road ahead

From [#206](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/206)
/ [#564](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/564):

1. **Migrate the bundled features** onto the loader (#564) — the relay,
   ActivityPub, git, pay and friends become battle-tested consumers, one at
   a time.
2. **The next demanded seams** —
   [`api.events.onResourceChange`](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/603)
   (react to pod writes; seven consumers waiting) and
   [`api.authorize`](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/604)
   (ask WAC about authority the caller doesn't drive), then `registerMcpTool`
   and `registerPane`, with the
   [pane store](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/184)
   as the eventual marketplace layer.
3. **Publish the plugin suite as a package** so
   `--plugin @jss/plugins/dashboard@/dashboard` loads by name, no clone.

The pattern for contributing a seam is established: build a real thing
against JSS, hit a wall, file the smallest issue that removes it, prove it
with your consumer. Seven seams (`appPaths`, `getAgent`, `ws.route`,
`mountApp`, `serverInfo`, `reservePath`, `api.plugins`) and the loader
itself each went from idea to npm this way — the door is open.
