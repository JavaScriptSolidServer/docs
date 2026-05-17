---
sidebar_position: 7
title: WebSocket Notifications
description: Real-time updates via the solid-0.1 protocol — JSS's primary notifications surface
---

# WebSocket Notifications

JSS treats WebSocket notifications as a **first-class, performance-critical** feature. A client subscribes to a resource URL on one socket; the server pushes a tiny text frame whenever that resource changes. The whole exchange is a handful of bytes per event.

JSS implements the [Solid WebSockets API spec](https://github.com/solid/solid-spec/blob/master/api-websockets.md) (`solid-0.1`).

## Position

JSS ships `solid-0.1` as the **primary** notifications surface. This is a deliberate choice — performance is a non-negotiable design constraint for JSS, and `solid-0.1` is roughly **an order of magnitude** lighter than the channel-based W3C Solid Notifications Protocol on every axis that matters:

| | `solid-0.1` | WebSocketChannel2023 |
|---|---|---|
| Setup round-trips | 1 (open WS) | 3 (discover + subscribe + open) |
| Wire format | Plain text frames | JSON-LD activities with `@context` |
| Bytes per change notification | ~30 (`pub <url>`) | ~300 (full JSON-LD envelope) |
| Multiplex | 1 socket → N subscriptions | 1 channel per subscription |
| Latency to first message | Single-digit ms | Tens of ms (multiple roundtrips) |
| Client code | ~10 LoC | ~50 LoC + JSON-LD library |
| Debugging | `nc`, `websocat`, any TCP tool | JSON-LD-aware tooling required |

For the kind of work JSS is built for — small Solid-native apps, real-time pod-mediated state, single-board / embedded deployments — those numbers move the design space. The same 50-line PDF reader that does live page-flip via `solid-0.1` would need a JSON-LD parser and per-resource channels under the modern spec.

We may add `WebSocketChannel2023` later as a **compatibility layer** for SDK-driven clients that require it. We won't deprecate `solid-0.1`.

## Enable

```bash
jss start --notifications
```

## Discover

Every response sets an `Updates-Via` header pointing at the server's notification WebSocket:

```bash
curl -I http://localhost:3000/alice/public/
# Updates-Via: ws://localhost:3000/.notifications
```

The spec defines this header on `OPTIONS`; JSS additionally sets it on every GET so clients don't need a separate request.

There's **one WebSocket per server**. Subscribe to as many resources as you want on the one connection.

## Connect

Open a WebSocket to the URL from `Updates-Via`:

```javascript
const ws = new WebSocket('ws://localhost:3000/.notifications');
```

JSS sends `protocol solid-0.1` as the first frame on every connection.

The spec also mentions a `Sec-WebSocket-Protocol: solid-0.1` header, but this was a later addition and almost no client in the wild sends it. JSS does not require it, and SolidOS / mashlib / our reference clients all omit it. Treat the header as optional; the first-frame greeting is the practical version handshake.

## Subscribe

Once connected, send `sub <absolute-url>`:

```
sub http://localhost:3000/alice/public/data.json
```

Subscribing to a **container** also works: changes to any child resource (POST, PUT, PATCH, DELETE) produce a `pub` for the container URI. This is the canonical pattern for "tell me when anything in this folder changes."

```
sub http://localhost:3000/alice/public/
```

On any change:

```
pub http://localhost:3000/alice/public/
```

The `pub` frame carries the URI of the changed resource, not its new content. Clients refetch if they need the new state. This is intentional — keeps frames small, avoids invalidating partial caches, and side-steps content negotiation entirely.

## JSS-specific extensions

The base spec defines `sub` and `pub`. JSS adds these to make subscription state observable and recoverable:

### `ack <absolute-url>`

Sent by the server after a successful subscribe. Lets clients distinguish "subscribed and listening" from "still negotiating." Clients can safely ignore it; tools that want to confirm subscriptions should wait for it.

### `err <absolute-url> <reason>`

Sent when a subscribe is rejected. Defined `<reason>` tokens:

- `forbidden` — ACL denied
- `not_found` — resource doesn't exist
- `bad_request` — URL malformed, exceeds length limit, or out of scope

### `unsub <absolute-url>`

Client→server: cancel a subscription without closing the socket. Closing the connection is the canonical "stop everything"; `unsub` is for clients that want fine-grained control on a long-lived socket.

These extensions are additive — clients that ignore them still get correct `pub` events.

## Implementation limits

JSS enforces:

- `MAX_SUBSCRIPTIONS_PER_CONNECTION = 100`
- `MAX_URL_LENGTH = 2048`

Subscribes that exceed either are rejected with `err <url> bad_request`. These are policy, not protocol.

## Auth

ACL `Read` is enforced **at subscribe time** against the connection's authenticated WebID (or `null` for anonymous). Authorized resources stay subscribed for the life of the socket; if the resource's ACL is later tightened, in-flight subscriptions MAY continue receiving notifications until the socket closes. Treat published URLs as **hints**, not authorization grants — refetching the resource re-checks ACL.

## Ordering and delivery

- Notifications for distinct URLs are unordered.
- Notifications for the same URL are delivered in the order the server applies the change.
- No deduplication at the protocol level. Rapid bursts of writes against the same resource may produce one frame per write. Servers MAY coalesce; JSS does not.

## Reconnect

If the socket drops, the client reconnects and re-subscribes from scratch. There is no resume token. Typical clients use exponential backoff (50 ms → 10 s cap); rebuilding subscriptions takes a few milliseconds.

## JavaScript example

```javascript
const url = 'http://localhost:3000/alice/public/data.json';
const ws = new WebSocket('ws://localhost:3000/.notifications');

ws.onopen = () => ws.send('sub ' + url);

ws.onmessage = (e) => {
  if (typeof e.data !== 'string') return;
  if (e.data.startsWith('pub ')) {
    const changed = e.data.slice(4);
    console.log('changed:', changed);
    // refetch if needed
  } else if (e.data.startsWith('ack ')) {
    console.log('subscribed:', e.data.slice(4));
  } else if (e.data.startsWith('err ')) {
    console.warn('subscribe failed:', e.data.slice(4));
  }
};

ws.onclose = () => { /* reconnect with backoff */ };
```

## Shell example

```bash
# requires websocat (https://github.com/vi/websocat)
echo "sub http://localhost:3000/alice/public/data.json" \
  | websocat -n1 ws://localhost:3000/.notifications -
```

## Relation to the W3C Solid Notifications Protocol

The W3C [Solid Notifications Protocol](https://solidproject.org/TR/notifications-protocol) defines a more general "channel" abstraction — `WebSocketChannel2023`, `WebhookChannel2023`, `StreamingHTTPChannel2023`, etc. — discovered via a subscription endpoint, negotiated with JSON-LD subscription documents, and instantiated as per-subscription channels.

JSS does not currently implement these channel types. The notifications surface here is intentionally narrower and lighter. We may add channel-protocol endpoints in future as a compatibility layer for clients that require them; the priorities remain (1) keep `solid-0.1` working, (2) keep it the fastest path for new clients.

## Why this matters for app design

Because the protocol is cheap, you can use the pod as a real-time state bus without thinking about cost:

- Write a tiny JSON-LD doc; subscribe to it on every connected client; one PUT propagates to everyone.
- Treat the doc as a control plane — one byte changed, all subscribers know.
- The transport overhead per event is dominated by the URL, not the payload.

The [PDF reader](https://github.com/solid-apps/pdf) and [Solid Chat](https://github.com/solid-chat/app) both use this pattern. The PDF reader's "flip the page from a curl command" demo is 50 lines of viewer code precisely because the protocol is small enough that 50 lines is what it takes.
