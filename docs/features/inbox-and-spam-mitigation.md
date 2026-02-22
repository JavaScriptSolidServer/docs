---
sidebar_position: 10
title: Inbox & Spam Mitigation
description: LDP inbox support with layered spam protection
---

# Inbox & Spam Mitigation

JSS provides LDP inbox containers with layered spam mitigation, following established web patterns for notification delivery and abuse prevention.

## Inbox Setup

Each pod is created with an `/inbox/` container. The default ACL grants:

- **Owner**: full control (Read, Write, Control)
- **Public**: APPEND only (anyone can POST notifications)

```turtle
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

# Owner has full access
<#owner>
    a acl:Authorization;
    acl:agent </alice/#me>;
    acl:accessTo <./>;
    acl:default <./>;
    acl:mode acl:Read, acl:Write, acl:Control.

# Anyone can append (POST) to inbox
<#public>
    a acl:Authorization;
    acl:agentClass foaf:Agent;
    acl:accessTo <./>;
    acl:mode acl:Append.
```

## How It Works

1. A client discovers the inbox via the resource or its owner's profile
2. The client POSTs a notification (e.g., access request, message, activity) to the inbox
3. WAC enforces that the sender has APPEND permission
4. The resource owner reads and processes notifications from their inbox

This follows the same pattern used by ActivityPub, Linked Data Notifications (LDN), and email.

## Spam Mitigation

JSS layers multiple defenses without modifying the inbox or LDP protocol. This mirrors how email solved spam — not by redesigning SMTP, but by layering mitigations on top.

### Rate Limiting

| Scope | Limit | Key |
|-------|-------|-----|
| **Global** | 100 requests/minute | Per client IP |
| **Write operations** (PUT/DELETE/POST/PATCH) | 60 requests/minute | Per WebID or IP |
| **Pod creation** | 1 per day | Per IP |

Rate limiting is applied via `@fastify/rate-limit`. Exceeded limits return `429 Too Many Requests` with a `Retry-After` header.

### WAC Enforcement

All POST requests to containers (including inboxes) require **APPEND** permission. This means:

- The server checks `.acl` files before accepting any write
- Inbox owners can restrict who can post by modifying the ACL
- Access can be limited to `acl:AuthenticatedAgent` (requires Solid-OIDC login) or specific agents

### Authentication

- **Solid-OIDC**: Token validation and WebID profile verification
- **DPoP binding**: Proof of possession prevents token replay
- **WebID-TLS**: Optional client certificate authentication

### Additional Protections

| Protection | Description |
|-----------|-------------|
| **Body size limit** | 10MB maximum request body |
| **Content-Type validation** | Only accepted RDF types (JSON-LD, Turtle, N3) |
| **Slug validation** | Container names limited to `[a-zA-Z0-9._-]`, max 255 chars |
| **WebSocket subscription limits** | 100 subscriptions per connection |
| **URL length limits** | 2048 character maximum |
| **Dotfile blocking** | `.git`, `.env`, `.acl` protected from unauthorized access |

## Comparison with Email Anti-Spam Evolution

The inbox spam problem is structurally similar to email spam. The web community solved email spam without redesigning SMTP:

| Email Layer | Solid Equivalent | JSS Status |
|------------|-----------------|------------|
| SPF/DKIM/DMARC (sender auth) | Solid-OIDC + WebID verification | Implemented |
| Rate limiting | Per-IP and per-WebID rate limits | Implemented |
| Content filtering | Payload shape validation | Partial (content-type only) |
| Reputation systems | Issuer allowlists / trust scores | Not yet implemented |
| UX segregation | Trusted vs untrusted inbox views | Not yet implemented |

## Planned

These are natural next steps that can be layered on without protocol changes, following industry best practices:

- **Issuer allowlists**: Trust specific OIDC issuers, deprioritize unknown ones
- **Payload shape validation**: Require notifications to match a specific ShEx/SHACL shape
- **Inbox segregation**: Separate trusted and untrusted notifications at the storage level
- **Reputation scoring**: Track sender behavior over time
- **HTTP 402 Payment Required**: Support for payment-gated access, enabling micropayments or subscription-based access control as a spam deterrent and monetization layer
- **CAPTCHA / proof-of-work challenges**: Raise the cost of automated abuse without blocking legitimate users
- **Sender verification escalation**: Progressively require stronger identity proof based on trust level

## ActivityPub Inbox

JSS also provides an ActivityPub inbox at `/ap/inbox` with additional protections:

- **HTTP Signature verification**: Validates signatures on incoming activities
- **Actor caching**: Caches remote actor profiles to reduce fetching
- **Activity type validation**: Requires valid `type` field on all activities
- **Supported activities**: Follow, Undo, Accept, Create, Like, Announce

## Design Philosophy

The inbox is a standard LDP container. Spam mitigation is orthogonal — applied at the deployment layer, not the protocol layer. This preserves interoperability while allowing each server to choose its own mitigation strategy.

This approach means:
- Any Solid client can POST to an inbox using standard LDP
- Server operators can tune rate limits, ACLs, and trust policies independently
- The protocol remains simple and composable
- New mitigation strategies can be added without breaking existing clients
