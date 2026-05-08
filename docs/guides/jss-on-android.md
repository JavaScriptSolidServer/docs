---
sidebar_position: 5
title: JSS on Android
description: Run a Solid pod on your phone — proof of concept today, native APK in development, full-OS long arc
---

# JSS on Android

A Solid pod, on your phone. JSS is small enough that the entire server runs on consumer Android hardware in less RAM than a single Chrome tab.

This page documents the three-stage path to that goal:

1. **Today — proof of concept via Termux** (works now)
2. **Coming — native APK** (in development)
3. **Long arc — full OS via postmarketOS** (the end state)

Each stage compiles toward the next.

---

## Today — proof of concept via Termux

[Termux](https://termux.dev/) is a Linux environment for Android that ships Node.js. JSS, written in pure JavaScript with no native modules, runs unmodified on this stack.

This is a **proof of concept**: it demonstrates that JSS's architecture is portable to phone hardware on resource-constrained devices. It is not a consumer-grade install — that is the next stage.

### Resource footprint

JSS uses approximately **125 MB of RAM** in steady state on Android — less than most browser tabs. CPU usage is light. Storage is filesystem-bound (typical pods are a few MB).

For comparison: a single Chrome tab on Android often uses 200–400 MB. A JSS pod fits inside that envelope.

### Install

Get Termux from [F-Droid](https://f-droid.org/en/packages/com.termux/) (recommended — more up-to-date than the Play Store version).

In Termux:

```bash
pkg update
pkg install nodejs-lts
npm install -g javascript-solid-server
```

### Run

```bash
jss start
```

The pod is now reachable from any browser on the phone at `http://localhost:4443/`:

![JSS running on Android, served at localhost:4443](/img/jss-on-android.png)

Standard Solid pod structure (`inbox/`, `private/`, `profile/`, `public/`, `settings/`) appears as expected. From here, normal Solid clients (the data browser shown above, mashlib, custom apps) work unchanged.

### Public access via `--tunnel`

`localhost` is only reachable from the phone itself. For public access, JSS includes a `--tunnel` flag — a JSS-native, decentralized alternative to services like ngrok:

```bash
jss start --tunnel-server https://your.public.jss.instance/
```

#### How it works

The local JSS opens a persistent WebSocket connection to a designated public JSS instance (the "tunnel server"). The public instance then relays incoming HTTP requests at `<server>/tunnel/<name>/...` back to the local pod over that WebSocket. The local pod becomes reachable via a public URL without exposing any port directly to the internet.

#### Why it matters

- **Decentralized.** No third-party service. Any public JSS instance can serve as a tunnel server — including one you run yourself on a $5 VPS.
- **No accounts.** No signup, no API key, no rate limit. Pure JSS-to-JSS over the open web.
- **Survives mobility.** Phone goes offline, comes back, the tunnel re-establishes automatically.
- **Composes with the rest of JSS.** A tunneled phone pod still speaks Solid, Git, ActivityPub, payments, and everything else the JSS server does — the tunnel is transparent at the protocol layer.

#### Comparison

| Approach | Third-party? | Account needed? | JSS-aware? |
|---|---|---|---|
| ngrok | yes | yes (free tier rate-limited) | no |
| Cloudflare Tunnel | yes | yes | no |
| Tailscale | yes (VPN service) | yes | no |
| **`jss --tunnel`** | **no** | **no** | **yes** |

### Persistence

Termux is killed by Android's task manager under memory pressure. For reliable always-on operation:

- **Disable battery optimization** for Termux: Settings → Apps → Termux → Battery → Unrestricted
- **Acquire a wakelock** in the running session: `termux-wake-lock`
- **Termux:Boot** add-on (also from F-Droid) lets startup scripts run on phone boot

### Storage

By default, pod data is stored under Termux's home directory and persists across reboots. To use a different location (for example, shared storage so other apps can read pod files):

```bash
termux-setup-storage  # one-time, grants storage permission
jss start --root ~/storage/shared/jss-data
```

---

## Coming — native APK

The Termux path proves that JSS runs on phone hardware. The next stage makes it consumer-installable: a native Android APK that bundles JSS for one-tap install.

The work is happening at [**JavaScriptSolidServer/jss-android**](https://github.com/JavaScriptSolidServer/jss-android) — currently in scaffold / pre-MVP stage.

### Architecture

![JSS Android architecture: Android APK with WebView and libnode.so JNI thread, communicating over HTTP on localhost](/img/jss-android-architecture.svg)

`libnode.so` from [`nodejs-mobile`](https://github.com/nodejs-mobile/nodejs-mobile) is linked via JNI and runs JSS on a dedicated thread. The WebView talks to JSS over HTTP — no platform-channel bridge needed (JSS is already a server, the WebView is already a client).

### Why this is feasible

- **JSS has zero native modules** — pure-JS only by design (`bcryptjs`, `sql.js`, `@noble/curves`). Bundling is a pure asset-copy.
- **Already runs on Android via Termux** — same Node 18+ runtime, same arm64 target.
- **Production prior art** — [Manyverse](https://www.manyverse.io/) (Scuttlebutt) and [Mapeo](https://www.mapeo.app/) ship the same `nodejs-mobile` + WebView pattern.

When the APK ships, install reduces to one tap from F-Droid (and eventually Play Store). Tracking issue: [JSS#366](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/366).

---

## Long arc — full OS via postmarketOS

Beyond an app on Android, the long-term direction is **JSS as a native data layer of an actual phone OS**.

[postmarketOS](https://postmarketos.org/) is a real Linux distribution for phones — a 10-year-life-cycle, mainstream-Linux-userland alternative to Android. Hundreds of devices supported.

In that context, JSS isn't an APK running inside a sandbox; it's a system service alongside any other daemon. The Solid pod becomes the device's native data layer for personal data — files, contacts, messages, notes, code repositories, AI conversations — all owned by the user, all standards-addressable, all portable across devices.

This is the end-state for the "Solid Pod on Every Phone" vision ([JSS#46](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/46)). Each stage above is a step toward it.

---

## Why "runs on a phone" matters

The phrase isn't a marketing claim. It's an architectural test:

- A server that runs on a phone is **light** (no JVM, no heavy runtime, minimal deps).
- A server that runs on a phone is **portable** (no platform lock-in, no cloud dependency).
- A server that runs on a phone is **personal** (your data lives where you live).
- A server that runs on a phone is **resilient** (your pod is reachable even when cloud providers go offline).

The Termux PoC is the smallest possible demonstration that JSS meets these tests. The APK and OS stages make the demonstration accessible to non-developer users.

---

## Related

- [Git on Solid](./git-on-solid.md) — git repos hosted on a pod
- [Deploy Production](./deploy-production.md) — production deployment patterns
- [Solid Pod on Every Phone (JSS#46)](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/46) — the umbrella vision
- [JSS#366](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/366) — Flutter/native APK tracking
- [postmarketOS](https://postmarketos.org/) — Linux distro for phones
