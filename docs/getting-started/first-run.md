---
sidebar_position: 3
title: First Run
description: You've just started JSS — here's what to do next
---

# First Run

You've installed JSS and run `jss start`. Here's what to do with it.

## You should see the welcome page

Open `http://localhost:<port>` (or whichever URL the server printed in the banner) in a browser. You'll see a **Welcome** page with a **Get started** button and — depending on what features you have on — **Sign up** and **Sign in** buttons.

If you see a JSON container listing instead of HTML, that's fine too: it just means there's no `index.html` in your data directory yet. The seeded landing page is skip-if-exists, so an existing operator file is preserved.

## Try it in a Solid app

The fastest way to "feel" the pod is to point an existing Solid app at it.

- **Mashlib data browser** — built into JSS. Visit `http://localhost:<port>/?inbox` to open it. Sign in with your WebID and explore.
- **Pilot** — [solidos.github.io/pilot](https://solidos.github.io/pilot/). A friendly notes app from the Solid Project that uses your pod as backend.
- **More apps** — [solidproject.org/apps](https://solidproject.org/apps).

When the app asks for your WebID or pod URL, give it the URL of your JSS server.

## Sign up / sign in

The **Sign up** and **Sign in** buttons on the landing page are revealed dynamically based on what your server actually exposes — the same seeded HTML adapts when you change modes.

- **Multi-user with `--idp`** — Sign up creates a new pod. Sign in logs into an existing one.
- **Single-user (`--single-user`)** — Sign up is hidden (registration is intentionally disabled). Sign in logs in as the single user (default name: `me`).
- **No IDP** — Both buttons are hidden. Use a Solid app's OIDC flow against an external Identity Provider, or use Nostr (NIP-98) auth.

## Connect from your own app

JSS speaks Solid-OIDC. From a JavaScript app:

```js
import { Session } from '@inrupt/solid-client-authn-browser';

const session = new Session();
await session.login({
  oidcIssuer: 'http://localhost:<port>/',
  redirectUrl: window.location.href,
  clientName: 'My App',
});
```

The `oidcIssuer` must match what your server publishes at `/.well-known/openid-configuration`. JSS sets this automatically based on the host you started on.

## Enable more features

JSS ships with several optional features off by default. Enable them with flags:

| Flag             | What you get                           |
| ---------------- | -------------------------------------- |
| `--idp`          | Built-in OIDC Identity Provider        |
| `--nostr`        | Nostr relay at `/relay`                |
| `--webrtc`       | WebRTC signalling                      |
| `--activitypub`  | ActivityPub federation                 |
| `--git`          | Git HTTP backend (clone/push)          |
| `--pay`          | HTTP 402 paid `/pay/*` routes          |
| `--mongo`        | MongoDB-backed `/db/` route            |
| `--tunnel`       | Public-tunnel exposure                 |
| `--terminal`     | Web terminal at `/.terminal`           |
| `--mashlib`      | Bundled Solid data browser             |
| `--notifications`| WebSocket change notifications         |

Full list and per-flag options: `jss start --help`.

## Customise the landing page

The Welcome page lives at `index.html` in your data directory. Edit it directly to change the copy, swap in your own HTML, or replace it entirely:

```bash
$EDITOR ./data/index.html   # or wherever your --root points
```

JSS will never overwrite an operator-provided file. The same skip-if-exists rule applies to `/.acl` and `/index.html.acl` — write your own if you need stricter (or looser) access rules.

If you want to revert to the default page, just delete `index.html` and restart the server.

## Where to ask questions

- **GitHub Discussions** — [JavaScriptSolidServer/JavaScriptSolidServer/discussions](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/discussions)
- **GitHub Issues** — [JavaScriptSolidServer/JavaScriptSolidServer/issues](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues)
- **Solid Forum** — [forum.solidproject.org](https://forum.solidproject.org/)

---

Want to dig deeper? Try the [Quick Start](./quick-start) for a curl-driven tour of the LDP API, or read [Core Concepts](../core-concepts/json-ld-first) to learn how JSS thinks about data.
