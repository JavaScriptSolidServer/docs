---
sidebar_position: 5
title: Authentication
description: Solid-OIDC, Nostr NIP-98, and token authentication
---

# Authentication

JSS supports multiple authentication methods.

## Simple Tokens (Development)

Token returned from pod creation:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/alice/private/
```

## Solid-OIDC

### Built-in Identity Provider

```bash
jss start --idp
```

Create a user:
```bash
curl -X POST http://localhost:3000/.pods \
  -H "Content-Type: application/json" \
  -d '{"name": "alice", "email": "alice@example.com", "password": "secret123"}'
```

OIDC Discovery: `/.well-known/openid-configuration`

### External Identity Providers

JSS accepts DPoP-bound tokens from any Solid IdP:

```bash
curl -H "Authorization: DPoP ACCESS_TOKEN" \
     -H "DPoP: DPOP_PROOF" \
     http://localhost:3000/alice/private/
```

## Nostr Authentication (NIP-98)

Sign requests with Nostr keys. Install the credential helper for git:

```bash
npm install -g git-credential-nostr
git-credential-nostr generate
git config --global credential.helper nostr
git config --global nostr.privkey <key>
```

See [git-credential-nostr](https://github.com/JavaScriptSolidServer/git-credential-nostr) for details.
