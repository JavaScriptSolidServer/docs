---
sidebar_position: 1
title: JSON-LD First
description: Why JSS treats JSON-LD as the native format
---

# JSON-LD First

JSS is a **JSON-LD native implementation**. Unlike traditional Solid servers that treat Turtle as the primary format, JSS:

- **Stores everything as JSON-LD** - No RDF parsing overhead
- **Serves JSON-LD by default** - Web apps consume responses directly
- **Content negotiation is optional** - Enable Turtle with `--conneg` when needed

## Why JSON-LD?

1. **Performance** - JSON parsing is native to JavaScript
2. **Simplicity** - JSON-LD is valid JSON, works with any tooling
3. **Web-native** - Browsers understand JSON natively
4. **Semantic web ready** - JSON-LD is a W3C standard RDF serialization

## When to enable content negotiation

Enable `--conneg` when:
- Interoperating with Turtle-based Solid apps
- Serving data to legacy Solid clients
- Running conformance tests

```bash
# JSON-LD only (fast, default)
jss start

# With Turtle support
jss start --conneg
```
