---
sidebar_position: 12
title: ActivityPub Federation
description: Federate with Mastodon and the Fediverse
---

# ActivityPub Federation

JSS includes a built-in ActivityPub server, allowing your Solid pod to federate with Mastodon, Pleroma, Misskey, and any ActivityPub-compatible service.

## Quick Start

```bash
jss start --activitypub --ap-username alice --ap-display-name "Alice"
```

Your actor is now discoverable at `@alice@yourserver.com` from any Mastodon instance.

## Configuration

| Flag | Description | Default |
|------|-------------|---------|
| `--activitypub` | Enable ActivityPub | Off |
| `--ap-username <name>` | Actor username | `me` |
| `--ap-display-name <name>` | Display name | Username |
| `--ap-summary <text>` | Bio / summary | Empty |
| `--ap-nostr-pubkey <hex>` | Link Nostr identity via `alsoKnownAs` | None |

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/.well-known/webfinger` | GET | Actor discovery |
| `/.well-known/nodeinfo` | GET | Server metadata (Mastodon-compatible) |
| `/profile/card` | GET | Actor profile (content-negotiated) |
| `/inbox` | POST | Receive activities from remote servers |
| `/profile/card/outbox` | GET | Published activities (last 20) |
| `/profile/card/outbox` | POST | Create and broadcast new posts |
| `/profile/card/followers` | GET | Followers collection |
| `/profile/card/following` | GET | Following collection |

## Supported Activities

### Incoming (Inbox)

| Activity | Behavior |
|----------|----------|
| **Follow** | Adds follower, auto-sends Accept |
| **Undo** | Removes follower |
| **Accept** | Marks outgoing follow as accepted |
| **Create** | Stores received note/post |
| **Like** | Stores like activity |
| **Announce** | Stores boost/reblog |

### Outgoing (Outbox)

Post a note:
```bash
curl -X POST https://yourserver.com/profile/card/outbox \
  -H "Content-Type: application/activity+json" \
  -d '{"type": "Note", "content": "Hello from my Solid pod!"}'
```

JSS wraps it in a `Create` activity, signs it with HTTP Signatures, and delivers to all follower inboxes.

## Security

- **HTTP Signature verification**: Validates signatures on incoming activities using the remote actor's public key
- **Actor caching**: Caches remote actor profiles to reduce network requests
- **RSA keypair**: Generated automatically and stored in `.server/` directory
- **Activity validation**: Requires valid `type` field on all incoming activities

## Nostr Identity Linking

Link your Nostr identity to your ActivityPub actor:

```bash
jss start --activitypub --ap-nostr-pubkey <hex-pubkey>
```

This adds an `alsoKnownAs` reference to your actor profile, enabling cross-protocol identity verification.

## NodeInfo

JSS exposes NodeInfo 2.1 metadata at `/.well-known/nodeinfo`, compatible with Mastodon and other Fediverse tools that discover server capabilities.
