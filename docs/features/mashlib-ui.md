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

## Add your own panes

```bash
jss start --mashlib-cdn --conneg --panes https://example.org/my-pane.js
```

`--panes` takes a list of pane modules that the data browser loads and registers before SolidOS starts, with no mashlib rebuild. See the [Dynamic Panes guide](/guides/dynamic-panes).

## Requirements

Mashlib works best with `--conneg` enabled for Turtle support.

## Profile Pages

Pod profiles (`/alice/`) use:
- [mashlib-jss](https://github.com/JavaScriptSolidServer/mashlib-jss) - Fixed for path-based pods
- [solidos-lite](https://github.com/SolidOS/solidos-lite) - Parses JSON-LD data islands
