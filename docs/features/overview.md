---
sidebar_position: 1
title: Features Overview
description: Complete list of JSS features
---

# Features Overview

JSS implements the Solid Protocol with additional features for modern web development.

## Implemented (v0.0.42)

| Feature | Description |
|---------|-------------|
| [LDP CRUD](/features/ldp-crud) | GET, PUT, POST, DELETE, HEAD |
| [Patching](/features/patching) | N3 Patch + SPARQL Update |
| Conditional Requests | If-Match/If-None-Match (304, 412) |
| [Access Control](/features/access-control) | WAC with .acl files |
| [Authentication](/features/authentication) | Solid-OIDC, Nostr NIP-98, tokens |
| [Git Integration](/features/git-integration) | Clone and push via git protocol |
| [WebSocket Notifications](/features/websocket-notifications) | Real-time updates |
| [Multi-user Pods](/features/multi-user-pods) | Path or subdomain based |
| [Mashlib UI](/features/mashlib-ui) | SolidOS data browser |
| Content Negotiation | JSON-LD, Turtle, HTML |
| CORS | Full cross-origin support |

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
