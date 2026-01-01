---
sidebar_position: 3
title: Content Negotiation
description: How JSS handles different RDF formats
---

# Content Negotiation

Content negotiation allows clients to request data in different formats.

## Supported Formats

| Format | Content-Type | Default |
|--------|--------------|---------|
| JSON-LD | `application/ld+json` | Yes |
| Turtle | `text/turtle` | With `--conneg` |
| HTML | `text/html` | For profiles |

## Requesting formats

Use the `Accept` header:

```bash
# Get JSON-LD (default)
curl http://localhost:3000/alice/public/data

# Get Turtle (requires --conneg)
curl -H "Accept: text/turtle" http://localhost:3000/alice/public/data

# Get HTML (for browsing)
curl -H "Accept: text/html" http://localhost:3000/alice/public/data
```

## Enable Turtle support

```bash
jss start --conneg
```

Or via environment variable:

```bash
JSS_CONNEG=true jss start
```
