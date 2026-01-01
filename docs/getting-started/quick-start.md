---
sidebar_position: 3
title: Quick Start
description: Get up and running with JSS in 5 minutes
---

# Quick Start

Get a Solid server running in under 5 minutes.

## Start the server

```bash
# Initialize configuration (interactive)
jss init

# Start server
jss start
```

Server is now running at `http://localhost:3000`.

## Create a pod

```bash
curl -X POST http://localhost:3000/.pods \
  -H "Content-Type: application/json" \
  -d '{"name": "alice"}'
```

Response:
```json
{
  "name": "alice",
  "webId": "http://localhost:3000/alice/#me",
  "podUri": "http://localhost:3000/alice/",
  "token": "eyJ..."
}
```

Save the `token` - you'll need it to write to your pod.

## Write data

```bash
curl -X PUT http://localhost:3000/alice/public/hello.json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/ld+json" \
  -d '{"@id": "#greeting", "http://schema.org/text": "Hello, Solid!"}'
```

## Read data

```bash
curl http://localhost:3000/alice/public/hello.json
```

## Next Steps

- [Core Concepts](/core-concepts/json-ld-first) - Understand JSS's design
- [Features](/features/overview) - Explore what JSS can do
