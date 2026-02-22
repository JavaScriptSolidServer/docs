---
sidebar_position: 13
title: Nostr Relay
description: Built-in NIP-01 Nostr relay with identity linking
---

# Nostr Relay

JSS includes a built-in Nostr relay, enabling your Solid pod to participate in the Nostr network. Clients can connect via WebSocket to publish and subscribe to events.

## Quick Start

```bash
jss start --nostr
```

Connect any Nostr client to `ws://localhost:3000/relay`.

## Configuration

| Flag | Description | Default |
|------|-------------|---------|
| `--nostr` | Enable Nostr relay | Off |
| `--nostr-path <path>` | WebSocket endpoint path | `/relay` |
| `--nostr-max-events <n>` | Max events in memory | `1000` |
| `--ap-nostr-pubkey <hex>` | Link Nostr identity to ActivityPub actor | None |

## Supported NIPs

| NIP | Name | Description |
|-----|------|-------------|
| NIP-01 | Basic Protocol | EVENT, REQ, CLOSE, EOSE messages |
| NIP-11 | Relay Information | Metadata at `/relay/info` |
| NIP-16 | Event Treatment | Replaceable, ephemeral, parameterized replaceable kinds |
| NIP-98 | HTTP Auth | Schnorr signature-based HTTP authentication |

## Event Kinds

The relay handles events differently based on their kind number:

| Kind Range | Type | Behavior |
|------------|------|----------|
| `0`, `3` | Replaceable | Stored; newer replaces older for same pubkey |
| `10000–19999` | Replaceable | Same as above |
| `20000–29999` | Ephemeral | Broadcast to subscribers, **not stored** |
| `30000–39999` | Parameterized Replaceable | Replaced by pubkey + kind + `d` tag |
| All others | Regular | Stored in FIFO queue |

## Protocol

### EVENT

Publish an event:
```json
["EVENT", {"id": "...", "pubkey": "...", "kind": 1, "content": "Hello from Solid!", "tags": [], "sig": "..."}]
```

The relay validates the event signature and stores or broadcasts it based on kind.

### REQ

Subscribe to events matching filters:
```json
["REQ", "sub-1", {"kinds": [1], "limit": 10}]
```

Filters support: `ids`, `authors`, `kinds`, `since`, `until`, `limit`, and tag filters (`#e`, `#p`, `#d`, etc.).

### CLOSE

Close a subscription:
```json
["CLOSE", "sub-1"]
```

## Relay Information (NIP-11)

`GET /relay/info` returns:

```json
{
  "name": "JSS Nostr Relay",
  "description": "Nostr relay integrated with JavaScript Solid Server",
  "supported_nips": [1, 11, 16],
  "software": "https://github.com/JavaScriptSolidServer/JavaScriptSolidServer",
  "version": "0.0.1"
}
```

## Rate Limiting

- **60 events per minute** per WebSocket connection
- Exceeded limits return an `OK` message with `rate-limited` error

## NIP-98 HTTP Authentication

Nostr keys can authenticate HTTP requests to your Solid pod using Schnorr signatures:

```
Authorization: Nostr <base64-encoded-kind-27235-event>
```

The signed event must include:
- `u` tag matching the request URL
- `method` tag matching the HTTP method
- Timestamp within ±60 seconds

This enables Nostr users to read/write Solid resources using their existing keypair.

### Browser Login

The built-in identity provider supports "Sign in with Schnorr" using any NIP-07 compatible signer extension (Podkey, nos2x, Alby).

## Identity Linking

### Nostr → ActivityPub

Link your Nostr pubkey to your ActivityPub actor:

```bash
jss start --activitypub --nostr --ap-nostr-pubkey <hex-pubkey>
```

This adds `alsoKnownAs: "did:nostr:<pubkey>"` to your actor profile, enabling cross-protocol identity verification.

### did:nostr Resolution

JSS resolves `did:nostr:<pubkey>` identities by:
1. Fetching the DID document
2. Verifying bidirectional linking (WebID ↔ did:nostr)
3. Caching results for 5 minutes

## Storage

Events are stored **in memory** using a FIFO queue. When the maximum is reached (default 1000), the oldest events are discarded. The relay is ephemeral — events do not persist across restarts.
