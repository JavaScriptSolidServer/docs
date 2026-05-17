---
sidebar_position: 7
title: WebSocket Notifications
description: Real-time updates via the solid-0.1 protocol, with JSS as a reference implementation
---

# WebSocket Notifications

JSS treats WebSocket notifications as a **first-class, performance-critical** feature. A client subscribes to a resource URL on one socket; the server pushes a tiny text frame whenever that resource changes. The whole exchange is a handful of bytes per event.

## Position

JSS ships the **`solid-0.1`** protocol as the primary notifications surface. This is a deliberate choice — performance is a non-negotiable design constraint for JSS, and `solid-0.1` is roughly **an order of magnitude** lighter than the channel-based W3C Solid Notifications Protocol on every axis that matters:

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

Every GET response sets an `Updates-Via` header pointing at the server's notification WebSocket:

```bash
curl -I http://localhost:3000/alice/public/
# Updates-Via: ws://localhost:3000/.notifications
```

There's one WebSocket per server. Subscribe to as many resources as you want on the one connection.

## Protocol: `solid-0.1`

`solid-0.1` originated in SolidOS/mashlib; it was never formally written down. JSS is the most active server implementing it today. The wire format is captured here as a normative reference for anyone writing a client.

### Frames

Every frame is a single line of UTF-8 text. The first space-delimited token is the **verb**; the remainder is the **argument**.

**Server greeting** (sent on connect):

```
protocol solid-0.1
```

**Client → server: subscribe**

```
sub <absolute-url>
```

Subscribes the current connection to change notifications for `<absolute-url>`. The URL must be absolute and within the server's scope. The server runs ACL Read on the resource as the connection's authenticated WebID (or `null` for anonymous); only authorized subscriptions are accepted.

**Server → client: ack**

```
ack <absolute-url>
```

Confirms a successful subscribe.

**Server → client: err**

```
err <absolute-url> <reason>
```

Subscribe denied. Defined `<reason>` tokens:

- `forbidden` — ACL denied
- `not_found` — resource doesn't exist (and the policy doesn't auto-create)
- `bad_request` — URL malformed, exceeds length limit, or out of scope

**Server → client: publish**

```
pub <absolute-url>
```

The resource at `<absolute-url>` has changed (PUT, POST, PATCH, DELETE, or container child add/remove). The client should refetch if it needs the new state. JSS does not include the new content in the frame — the notification is a signal, not a payload.

**Client → server: unsubscribe** *(optional)*

```
unsub <absolute-url>
```

Removes a previously-acknowledged subscription. Servers SHOULD support this; clients SHOULD NOT rely on it (closing the socket is the canonical "stop").

### Semantics

- **Multiplex.** One connection carries many subscriptions. The server tracks a `socket → Set<url>` map; clients track their own. There is no per-resource "channel" concept.
- **Auth scope.** ACL is checked at subscribe time. If the client's permissions later change (e.g. ACL is tightened), in-flight subscriptions MAY continue to receive notifications until the connection closes. Clients should treat published URLs as hints, not authorization grants — refetching the resource will re-check ACL.
- **Ordering.** Notifications for distinct URLs are unordered. Notifications for the same URL are delivered in the order the server applies the change.
- **De-duplication.** None at the protocol level. A rapid burst of writes against the same resource may produce one frame per write; servers MAY coalesce.
- **No payload.** `pub` carries a URL, not the new representation. This is intentional — keeps frames small, avoids invalidating client caches on partial reads, and side-steps content negotiation entirely.
- **Lifecycle.** Subscriptions live until the socket closes or the client sends `unsub`. There is no TTL.

### Limits (JSS implementation)

- `MAX_SUBSCRIPTIONS_PER_CONNECTION = 100`
- `MAX_URL_LENGTH = 2048`

A subscribe that exceeds either limit is rejected with `err <url> bad_request`. These values are policy, not protocol — other servers MAY set them differently.

### Reconnect

If the socket drops, the client reconnects and re-subscribes from scratch. There is no resume token. In practice this is invisible: the typical client uses exponential-backoff reconnect (50 ms → 10 s cap) and rebuilds subscriptions in a few milliseconds.

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
