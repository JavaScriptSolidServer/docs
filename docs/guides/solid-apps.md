---
sidebar_position: 4
title: Connect Solid Apps
description: Use existing Solid applications with JSS
---

# Connect Solid Apps

JSS works with existing Solid applications.

## SolidOS / Mashlib

Enable the data browser:

```bash
jss start --mashlib-cdn --conneg
```

Browse to any resource in a web browser to see the Mashlib UI.

## Solid-OIDC Apps

For apps that require Solid-OIDC login:

```bash
jss start --idp --conneg
```

Create a user with email/password:

```bash
curl -X POST http://localhost:3000/.pods \
  -H "Content-Type: application/json" \
  -d '{"name": "alice", "email": "alice@example.com", "password": "secret"}'
```

The app can discover the IdP at `/.well-known/openid-configuration`.

## Common Apps

| App | Requirements | Notes |
|-----|--------------|-------|
| SolidOS | `--conneg`, `--mashlib-cdn` | Full data browser |
| Solid File Client | `--conneg` | File management |
| Penny | `--idp`, `--conneg` | Pod browser |

## Troubleshooting

### App can't parse responses

Enable content negotiation:
```bash
jss start --conneg
```

### Login doesn't work

Enable the Identity Provider:
```bash
jss start --idp
```

### CORS errors

JSS has CORS enabled by default. If issues persist, check your reverse proxy configuration.
