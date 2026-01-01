---
sidebar_position: 1
title: Introduction
description: What is JavaScript Solid Server and why use it
---

# Introduction

JavaScript Solid Server (JSS) is a minimal, fast, JSON-LD native [Solid](https://solidproject.org) server.

## What is Solid?

Solid is a specification for decentralized data storage. Users store their data in "pods" (personal online data stores) and grant applications permission to read or write specific data. This gives users control over their data rather than applications.

## Why JSS?

| Server | Size | Dependencies | Philosophy |
|--------|------|--------------|------------|
| **JSS** | 432 KB | 10 | Minimal, JSON-LD native |
| NSS | 777 KB | 58 | Original Solid server |
| CSS | 5.8 MB | 70 | Modular, configurable |

JSS is designed for:

- **Speed** - JSON-LD native means no RDF parsing overhead
- **Simplicity** - Single command to start, minimal configuration
- **Modern web** - JSON-LD is valid JSON, works with any tooling
- **Decentralized identity** - Supports Nostr (NIP-98) alongside Solid-OIDC

## Key Features

- Full LDP CRUD operations
- Web Access Control (WAC)
- Solid-OIDC Identity Provider
- Nostr authentication (NIP-98)
- Git HTTP backend
- WebSocket notifications
- Multi-user pods

## Next Steps

- [Installation](/getting-started/installation) - Get JSS running
- [Quick Start](/getting-started/quick-start) - Create your first pod
