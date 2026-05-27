---
sidebar_position: 6
title: Account Management
description: Self-service change password, pod backup/export, and account deletion
---

# Account Management

Once an account exists (see [Authentication](./authentication.md) for how to create one
and log in), JSS gives the account owner a self-service "user-rights trio" plus passkey
enrolment. Every action below is scoped to the **authenticated caller's own WebID** — there
is no target parameter, so cross-account access is structurally impossible.

All endpoints accept any of the server's auth schemes: `Authorization: Bearer <token>`,
DPoP-bound tokens, or Nostr NIP-98 signatures.

## Endpoint reference

| Action | Method & path | Auth | Request body | Success |
|---|---|---|---|---|
| Change password | `PUT /idp/credentials` | Owner | `{ currentPassword, newPassword }` | `200 { ok, webid, passwordChangedAt }` |
| Backup / export pod | `GET /idp/account/export` | Owner | — | `200` `tar.gz` stream |
| Delete account (API) | `DELETE /idp/account` | Owner | `{ currentPassword, purgeData? }` | `200 { ok, webid, purged }` |
| Delete account (browser) | `GET` / `POST /idp/account/delete` | Owner (via form) | password field | HTML confirmation |
| Passkey – register | `POST /idp/passkey/register/options`, `POST /idp/passkey/register/verify` | Session | WebAuthn ceremony | — |
| Passkey – login | `POST /idp/passkey/login/options`, `POST /idp/passkey/login/verify` | — | WebAuthn ceremony | — |
| Delete account (operator) | `jss account delete <username>` (CLI) | Filesystem | — | console output |

All three trio endpoints send `Cache-Control: no-store`. Re-authentication via
`currentPassword` is required for both password change and deletion — possession of a token
alone is not enough to perform a destructive change.

---

## Change your password

The authenticated owner rotates their own password. The current password must be supplied
as a re-auth proof; this is verified without side effects (it does **not** stamp a login).

```bash
curl -X PUT https://pod.example/idp/credentials \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"old-secret","newPassword":"new-stronger-secret"}'
```

```json
{
  "ok": true,
  "webid": "https://pod.example/alice/profile/card#me",
  "passwordChangedAt": "2026-05-27T10:30:00.000Z"
}
```

**Failure modes**

| Status | Meaning |
|---|---|
| `400` | `currentPassword` / `newPassword` missing or not strings |
| `401` | Not authenticated, or `currentPassword` is wrong |
| `403` | Authenticated WebID has no matching account on this server |

:::note Existing tokens
Rotating the password does not invalidate already-issued access tokens — they reference the
WebID and remain valid until they expire. The new password applies to future logins.
:::

---

## Back up / export your pod

`GET /idp/account/export` streams a gzipped tar of the owner's entire pod tree plus a
manifest. The stream is built with constant memory (`tar.pack → gzip → response`), so a
multi-gigabyte pod won't exhaust server memory.

```bash
# -OJ saves using the server-provided filename
curl -L -OJ https://pod.example/idp/account/export \
  -H "Authorization: Bearer $TOKEN"
# → jss-export-alice-2026-05-27T10-30-00-000Z-a1b2c3.tar.gz
```

- **Content-Type:** `application/x-tar+gzip`
- **Content-Disposition:** `attachment` with a timestamped, randomised filename
- The archive root is `jss-export/`, containing `manifest.json` and the pod resources.

The `manifest.json` records who/what produced the archive:

```json
{
  "webId": "https://pod.example/alice/profile/card#me",
  "username": "alice",
  "email": "alice@example.com",
  "podName": "alice",
  "mode": "multi-user",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "exportedAt": "2026-05-27T10:30:00.000Z",
  "jssVersion": "0.0.203"
}
```

:::tip Credible Exit — your keys leave with you
When the pod was provisioned with keys (`--provision-keys`), the export **intentionally
includes** `/private/privkey.jsonld`. The user's secret is theirs; withholding it would make
self-sovereign identity migration impossible. The endpoint is owner-authenticated, so the
secret never crosses the WAC perimeter to anyone but the owner.
:::

**Failure modes**

| Status | Meaning |
|---|---|
| `401` | Not authenticated |
| `403` | No account for the caller's WebID (multi-user), or the authenticated WebID is not the seeded owner (single-user, e.g. an external Solid-OIDC / LWS identity) |
| `404` | Pod directory unexpectedly missing |
| `500` | Server-internal name validation regressed (defensive) |

**Out of scope:** re-import, cross-server pod migration, scheduled/periodic backups, and
partial / per-resource selection. The export is a one-shot, whole-pod snapshot.

---

## Delete your account

### Via the API

```bash
curl -X DELETE https://pod.example/idp/account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"my-secret","purgeData":true}'
```

```json
{ "ok": true, "webid": "https://pod.example/alice/profile/card#me", "purged": true }
```

- `purgeData: true` (optional) also removes the pod's filesystem tree at
  `<dataRoot>/<podName>/`. Omit it to delete only the account record and keep the data.
- OIDC session cookies are expired on the response so the browser won't replay stale
  references on the next login.

**Failure modes**

| Status | Meaning |
|---|---|
| `400` | `currentPassword` missing |
| `401` | Not authenticated, or `currentPassword` is wrong |
| `403` | Single-user mode (deletion via HTTP is disabled — use the CLI), or no account for the caller's WebID |

### Via the browser

A no-JavaScript HTML flow is available for users without API tooling:

- `GET /idp/account/delete` — renders the confirmation form
- `POST /idp/account/delete` — submits it (authentication happens by entering the password)

These responses carry anti-clickjacking headers (`X-Frame-Options: DENY`,
`Content-Security-Policy: frame-ancestors 'none'`) so the destructive form cannot be embedded
in a hostile iframe.

### Via the operator CLI

In **single-user mode** HTTP deletion is refused — removing the only account would brick the
server until re-seed. An operator with filesystem access uses the CLI instead:

```bash
jss account delete alice            # delete account, keep pod data
jss account delete alice --purge    # also remove pod data
jss account delete alice -y         # skip the confirmation prompt
jss account delete alice -r ./data  # point at a specific data directory
```

---

## Passkeys (WebAuthn)

JSS supports passkey enrolment and login alongside passwords. These endpoints implement the
standard WebAuthn challenge/response ceremony:

- **Register:** `POST /idp/passkey/register/options` returns a registration challenge;
  `POST /idp/passkey/register/verify` validates the authenticator's attestation.
- **Login:** `POST /idp/passkey/login/options` returns an authentication challenge;
  `POST /idp/passkey/login/verify` validates the assertion.

The bodies are produced and consumed by a browser WebAuthn client rather than hand-crafted,
so they are not documented as flat JSON here. See [Authentication](./authentication.md) for
the surrounding login flow.
