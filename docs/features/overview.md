---
sidebar_position: 1
title: Features Overview
description: Complete list of JSS features
---

# Features Overview

JSS is a lightweight, fast Solid server for Node.js. It implements the Solid Protocol with additional features for development, federation, and personal pod hosting.

**Current version:** 0.0.86

## Quick Start

```bash
npx servejss
```

A drop-in alternative to `npx serve` with REST write support, live reload, and Solid protocol underneath.

---

## Core Solid Protocol

| Feature | Description | Docs |
|---------|-------------|------|
| [LDP CRUD](/docs/features/ldp-crud) | GET, PUT, POST, DELETE, HEAD on resources and containers | [Details](/docs/features/ldp-crud) |
| [Web Access Control](/docs/features/access-control) | WAC with `.acl` files, agent/group/public permissions | [Details](/docs/features/access-control) |
| [Content Negotiation](/docs/features/ldp-crud) | JSON-LD, Turtle, N3, N-Triples (`--conneg`) | |
| [Patching](/docs/features/patching) | N3 Patch + SPARQL Update for partial edits | [Details](/docs/features/patching) |
| Conditional Requests | If-Match / If-None-Match with ETag support (304, 412) | |
| [WebSocket Notifications](/docs/features/websocket-notifications) | Real-time updates via solid-0.1 protocol | [Details](/docs/features/websocket-notifications) |
| [Multi-user Pods](/docs/features/multi-user-pods) | Path-based or subdomain-based pod isolation | [Details](/docs/features/multi-user-pods) |
| Pod Discovery | `.well-known/openid-configuration`, TypeIndex generation | |
| HTTP Range Requests | Partial content delivery for streaming media | |
| Storage Quotas | Per-pod quota enforcement with CLI management | |
| CORS | Full cross-origin support with proper header exposure | |

## Authentication & Identity

| Feature | Description | Docs |
|---------|-------------|------|
| [Solid-OIDC](/docs/features/authentication) | Token validation with DPoP proof-of-possession | [Details](/docs/features/authentication) |
| Built-in Identity Provider | Full OAuth2/OIDC login flows (`--idp`) | |
| Passkey / WebAuthn | Passwordless authentication using FIDO2 | |
| WebID-TLS | Client certificate authentication with X.509 certs | |
| Nostr NIP-98 | Schnorr signature-based HTTP auth, `did:nostr` identity | |
| Invite-only Registration | Restrict signups with invite codes (`--invite-only`) | |
| Token Management | DPoP validation, jti replay prevention | |

## Developer Tools

| Feature | Description |
|---------|-------------|
| **Live Reload** | Edit a file, browser refreshes automatically (`--live-reload`) |
| **Public Mode** | Skip authentication for local development (`--public`) |
| **Read-only Mode** | Disable PUT/DELETE/PATCH for safe viewing (`--read-only`) |
| **Single-user Mode** | Personal pod server, no registration needed (`--single-user`) |
| File Watcher | Detects filesystem changes and triggers WebSocket notifications |
| [Mashlib / SolidOS](/docs/features/mashlib-ui) | Data browser UI, local or CDN mode (`--mashlib`, `--mashlib-cdn`) |
| SolidOS UI | Modern Nextcloud-style interface (`--solidos-ui`) |
| Config System | CLI args > env vars > config file > defaults |
| Print Config | Debug configuration with `--print-config` |

## Federation & Social

| Feature | Description |
|---------|-------------|
| **ActivityPub** | Full federation support with inbox, outbox, followers (`--activitypub`) |
| Webfinger | Standard actor discovery for federation |
| **Nostr Relay** | NIP-01 relay with configurable event limits (`--nostr`) |
| Nostr Event Types | Replaceable, ephemeral, parameterized replaceable kinds |
| Nostr-AP Linking | Link Nostr identity to ActivityPub actor (`--ap-nostr-pubkey`) |

## Security

| Feature | Description | Docs |
|---------|-------------|------|
| [Inbox & Spam Mitigation](/docs/features/inbox-and-spam-mitigation) | Layered defenses on LDP inboxes | [Details](/docs/features/inbox-and-spam-mitigation) |
| Rate Limiting | Global (100/min), writes (60/min), pod creation (1/day) |  |
| SSL/TLS | HTTPS with custom certificates (`--ssl-key`, `--ssl-cert`) | |
| Dotfile Protection | Blocks `.git`, `.env`, `.htpasswd` access | |
| SSRF Protection | URL validation for external fetches | |
| Path Traversal Protection | Sanitization in all handlers | |
| DPoP Replay Prevention | jti cache prevents token reuse | |
| Password Hashing | bcryptjs with minimum length validation | |

## Integrations

| Feature | Description | Docs |
|---------|-------------|------|
| [Git HTTP Backend](/docs/features/git-integration) | Clone and push repos via HTTPS (`--git`) | [Details](/docs/features/git-integration) |
| servejss | `npx serve` alternative with write support and live reload | |
| Cross-platform | Runs on Android/Termux via sql.js and bcryptjs fallbacks | |

---

## HTTP Methods

| Method | Support |
|--------|---------|
| GET | Full |
| HEAD | Full |
| PUT | Full |
| POST | Full |
| DELETE | Full |
| PATCH | N3 Patch + SPARQL Update |
| OPTIONS | Full with CORS |

## CLI Commands

```bash
jss start [options]      # Start the server
jss init                 # Interactive configuration setup
jss invite create        # Create invite code
jss invite list          # List invite codes
jss invite revoke <code> # Revoke invite code
jss quota set <user> <size>   # Set storage quota
jss quota show <user>         # Show quota info
jss quota reconcile <user>    # Recalculate from disk
```

## What's New Since v0.0.42

| Version | Feature |
|---------|---------|
| v0.0.59 | Nostr relay (NIP-01) |
| v0.0.61 | ActivityPub federation |
| v0.0.75 | WebID-TLS authentication |
| v0.0.76 | SolidOS modern UI |
| v0.0.77 | Single-user mode, Passkey/WebAuthn auth |
| v0.0.80 | Cross-platform support (Android/Termux) |
| v0.0.82 | Public mode, Read-only mode |
| v0.0.84 | Live reload with filesystem watcher |
| v0.0.85 | File watcher for external changes |
| v0.0.86 | WebSocket fix for public mode, port fix for file watcher |
