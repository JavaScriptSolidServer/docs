---
sidebar_position: 1
title: CLI Commands
description: jss command line interface
---

# CLI Commands

## jss start

Start the server.

```bash
jss start [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --port <n>` | Port to listen on | 3000 |
| `-h, --host <addr>` | Host to bind to | 0.0.0.0 |
| `-r, --root <path>` | Data directory | ./data |
| `-c, --config <file>` | Config file path | - |
| `--ssl-key <path>` | SSL private key (PEM) | - |
| `--ssl-cert <path>` | SSL certificate (PEM) | - |
| `--conneg` | Enable Turtle support | false |
| `--notifications` | Enable WebSocket | false |
| `--idp` | Enable built-in IdP | false |
| `--idp-issuer <url>` | IdP issuer URL | (auto) |
| `--subdomains` | Enable subdomain pods | false |
| `--base-domain <domain>` | Base domain for subdomains | - |
| `--mashlib` | Enable Mashlib (local) | false |
| `--mashlib-cdn` | Enable Mashlib (CDN) | false |
| `--mashlib-version <ver>` | Mashlib CDN version | 2.0.0 |
| `--git` | Enable Git HTTP backend | false |
| `-q, --quiet` | Suppress logs | false |

## jss init

Interactive configuration setup.

```bash
jss init [options]
```

## jss --help

Show help information.

```bash
jss --help
```
