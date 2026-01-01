---
sidebar_position: 2
title: Configuration
description: Config file, environment variables, and options
---

# Configuration

JSS can be configured via CLI options, environment variables, or config file.

## Priority

1. CLI options (highest)
2. Environment variables
3. Config file
4. Defaults (lowest)

## Environment Variables

All options can be set with `JSS_` prefix:

```bash
export JSS_PORT=8443
export JSS_SSL_KEY=/path/to/key.pem
export JSS_SSL_CERT=/path/to/cert.pem
export JSS_CONNEG=true
export JSS_SUBDOMAINS=true
export JSS_BASE_DOMAIN=example.com
export JSS_MASHLIB=true
export JSS_GIT=true
jss start
```

## Config File

Create `config.json`:

```json
{
  "port": 8443,
  "root": "./data",
  "sslKey": "./ssl/key.pem",
  "sslCert": "./ssl/cert.pem",
  "conneg": true,
  "notifications": true,
  "idp": true,
  "subdomains": true,
  "baseDomain": "example.com",
  "mashlib": true,
  "git": true
}
```

Use it:

```bash
jss start --config config.json
```

## All Options

| Option | Env Var | Config Key | Default |
|--------|---------|------------|---------|
| `--port` | `JSS_PORT` | `port` | 3000 |
| `--host` | `JSS_HOST` | `host` | 0.0.0.0 |
| `--root` | `JSS_ROOT` | `root` | ./data |
| `--ssl-key` | `JSS_SSL_KEY` | `sslKey` | - |
| `--ssl-cert` | `JSS_SSL_CERT` | `sslCert` | - |
| `--conneg` | `JSS_CONNEG` | `conneg` | false |
| `--notifications` | `JSS_NOTIFICATIONS` | `notifications` | false |
| `--idp` | `JSS_IDP` | `idp` | false |
| `--subdomains` | `JSS_SUBDOMAINS` | `subdomains` | false |
| `--base-domain` | `JSS_BASE_DOMAIN` | `baseDomain` | - |
| `--mashlib` | `JSS_MASHLIB` | `mashlib` | false |
| `--mashlib-cdn` | `JSS_MASHLIB_CDN` | `mashlibCdn` | false |
| `--git` | `JSS_GIT` | `git` | false |
