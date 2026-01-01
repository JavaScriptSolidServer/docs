---
sidebar_position: 2
title: LDP CRUD Operations
description: Create, read, update, delete resources
---

# LDP CRUD Operations

JSS implements the Linked Data Platform (LDP) specification for resource management.

## GET - Read resources

```bash
curl http://localhost:3000/alice/public/data.json
```

## PUT - Create or update

```bash
curl -X PUT http://localhost:3000/alice/public/data.json \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/ld+json" \
  -d '{"@id": "#item", "http://schema.org/name": "Example"}'
```

## POST - Create in container

```bash
curl -X POST http://localhost:3000/alice/public/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/ld+json" \
  -H "Slug: new-resource" \
  -d '{"@id": "#item", "http://schema.org/name": "New"}'
```

## DELETE - Remove resources

```bash
curl -X DELETE http://localhost:3000/alice/public/data.json \
  -H "Authorization: Bearer TOKEN"
```

## Conditional Requests

Use ETags for safe concurrent updates:

```bash
# Get current ETag
ETAG=$(curl -sI http://localhost:3000/alice/public/data.json | grep -i etag | awk '{print $2}')

# Update only if unchanged
curl -X PUT http://localhost:3000/alice/public/data.json \
  -H "Authorization: Bearer TOKEN" \
  -H "If-Match: $ETAG" \
  -H "Content-Type: application/ld+json" \
  -d '{"@id": "#item", "http://schema.org/name": "Updated"}'
```
