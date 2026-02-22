---
sidebar_position: 14
title: Quotas & Invites
description: Storage quota enforcement and invite-only registration
---

# Quotas & Invites

JSS includes per-pod storage quotas and invite code management for controlled deployments.

## Storage Quotas

### Setting Quotas

```bash
# Set a 100MB quota for alice
jss quota set alice 100MB

# Check alice's usage
jss quota show alice

# Recalculate from disk (if tracking drifts)
jss quota reconcile alice
```

### How Quotas Work

Each pod stores a `.quota.json` file at its root:

```json
{
  "limit": 52428800,
  "used": 1024000
}
```

**Enforcement happens at three points:**

| Operation | Check |
|-----------|-------|
| **POST** (create resource) | Rejects if `used + newFileSize > limit` |
| **PUT** (update resource) | Rejects if `used + sizeDelta > limit` (only when file grows) |
| **DELETE** | Subtracts deleted file size from `used` |

When a quota is exceeded, the server returns **HTTP 507 Insufficient Storage**.

### Default Quota

New pods are created with a default quota of **50MB**. Set via:

| Method | Example |
|--------|---------|
| Config file | `"defaultQuota": "100MB"` |
| Environment variable | `JSS_DEFAULT_QUOTA=100MB` |

A value of `0` means unlimited.

### Size Formats

Supported size strings: `B`, `KB`, `MB`, `GB`, `TB`

```bash
jss quota set alice 500MB
jss quota set bob 2GB
```

### Reconciliation

If quota tracking gets out of sync (e.g., files modified outside JSS), reconcile recalculates actual disk usage:

```bash
jss quota reconcile alice
```

This recursively sums all file sizes in the pod directory, excluding `.quota.json` itself.

---

## Invite Codes

### Quick Start

```bash
# Enable invite-only registration
jss start --invite-only --idp

# Create an invite code
jss invite create

# Create with multiple uses and a note
jss invite create -u 5 -n "Team members"
```

### Managing Invites

```bash
# List all codes
jss invite list

# Output:
# CODE        USES     CREATED      NOTE
# ABC123DE    2/5      2024-01-15   Team members
# XYZ789AB    0/1      2024-01-16

# Revoke a code
jss invite revoke ABC123DE
```

### Configuration

| Flag | Description | Default |
|------|-------------|---------|
| `--invite-only` | Require invite code to register | Off |
| `--single-user` | Disable registration entirely | Off |

### How Invites Work

1. Admin creates an invite code via `jss invite create`
2. Code is stored in `.server/invites.json`
3. User enters the code during registration
4. Server validates and consumes one use
5. If `maxUses` reached, the code is exhausted

**Code format:** 8-character uppercase alphanumeric (ambiguous characters like O, I, L are replaced for clarity).

**Create options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-u, --uses <n>` | Maximum number of uses | `1` |
| `-n, --note <text>` | Description for the code | None |

### Registration Modes

| Mode | Flag | Behavior |
|------|------|----------|
| Open | (default) | Anyone can register |
| Invite-only | `--invite-only` | Requires valid invite code |
| Single-user | `--single-user` | No registration, pod created at startup |

---

## Rate Limits

These rate limits protect against abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Pod creation (`POST /.pods`) | 1 per IP | 24 hours |
| Registration (`POST /idp/register`) | 5 per IP | 1 hour |
| Login attempts | 10 per IP | 1 minute |
| Write operations (PUT/DELETE/PATCH) | 60 per identity | 1 minute |
| Global requests | 100 per IP | 1 minute |

Exceeded limits return **HTTP 429 Too Many Requests** with a `Retry-After` header.
