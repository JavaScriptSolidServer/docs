---
sidebar_position: 8
title: Multi-User Pods
description: Path-based and subdomain-based pod hosting
---

# Multi-User Pods

JSS supports hosting multiple users on a single server.

## Path-based (default)

Users are at paths: `example.com/alice/`, `example.com/bob/`

```bash
jss start
```

Simple but all pods share the same origin (XSS risk between pods).

## Subdomain-based

Users get subdomains: `alice.example.com`, `bob.example.com`

```bash
jss start --subdomains --base-domain example.com
```

Each pod has its own origin (browser's Same-Origin Policy protects).

## Comparison

| Mode | URL | Origin | XSS Risk |
|------|-----|--------|----------|
| Path | `example.com/alice/` | `example.com` | Shared |
| Subdomain | `alice.example.com/` | `alice.example.com` | Isolated |

## DNS Configuration

For subdomain mode, you need a wildcard DNS record:

```
*.example.com  A  <your-server-ip>
```

## Pod URLs

| Path Mode | Subdomain Mode |
|-----------|----------------|
| `example.com/alice/` | `alice.example.com/` |
| `example.com/alice/#me` | `alice.example.com/#me` |
