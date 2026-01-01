---
sidebar_position: 3
title: HTTP API
description: REST API endpoints and headers
---

# HTTP API

## Pod Management

### Create Pod

```http
POST /.pods
Content-Type: application/json

{"name": "alice"}
```

Response:
```json
{
  "name": "alice",
  "webId": "http://localhost:3000/alice/#me",
  "podUri": "http://localhost:3000/alice/",
  "token": "..."
}
```

With IdP enabled:
```json
{"name": "alice", "email": "alice@example.com", "password": "secret"}
```

## Resource Operations

### GET

```http
GET /alice/public/data.json
Accept: application/ld+json
```

### PUT

```http
PUT /alice/public/data.json
Authorization: Bearer TOKEN
Content-Type: application/ld+json

{"@id": "#item", "http://schema.org/name": "Value"}
```

### POST

```http
POST /alice/public/
Authorization: Bearer TOKEN
Content-Type: application/ld+json
Slug: new-resource

{"@id": "#item"}
```

### DELETE

```http
DELETE /alice/public/data.json
Authorization: Bearer TOKEN
```

### PATCH

```http
PATCH /alice/public/data.json
Authorization: Bearer TOKEN
Content-Type: text/n3

@prefix solid: <http://www.w3.org/ns/solid/terms#>.
_:p a solid:InsertDeletePatch;
  solid:inserts { <#x> <#y> <#z> }.
```

## Headers

### Request Headers

| Header | Description |
|--------|-------------|
| `Authorization` | `Bearer TOKEN` or `DPoP TOKEN` |
| `Content-Type` | Resource MIME type |
| `Accept` | Requested response format |
| `If-Match` | ETag for conditional update |
| `If-None-Match` | ETag for conditional create |
| `Slug` | Suggested resource name for POST |

### Response Headers

| Header | Description |
|--------|-------------|
| `ETag` | Resource version |
| `Link` | LDP type links |
| `Updates-Via` | WebSocket notification URL |
| `WAC-Allow` | Permitted operations |
