---
sidebar_position: 9
title: Mashlib UI
description: SolidOS data browser for viewing and editing RDF
---

# Mashlib UI

JSS can serve the [SolidOS Mashlib](https://github.com/SolidOS/mashlib) data browser for viewing and editing RDF resources.

## CDN Mode (recommended for getting started)

```bash
jss start --mashlib-cdn --conneg
```

Loads mashlib from unpkg.com. Zero footprint.

## Local Mode (production/offline)

```bash
jss start --mashlib --conneg
```

Serves mashlib from local files. Requires building:

```bash
cd src/mashlib-local
npm install && npm run build
```

## How it works

1. Browser requests `/alice/public/data.ttl` with `Accept: text/html`
2. Server returns Mashlib HTML wrapper
3. Mashlib fetches actual data via content negotiation
4. Mashlib renders interactive, editable view

## Requirements

Mashlib works best with `--conneg` enabled for Turtle support.

## Profile Pages

Pod profiles (`/alice/`) use:
- [mashlib-jss](https://github.com/JavaScriptSolidServer/mashlib-jss) - Fixed for path-based pods
- [solidos-lite](https://github.com/SolidOS/solidos-lite) - Parses JSON-LD data islands
