---
sidebar_position: 3
title: Git on Solid
description: Architectural patterns and security surfaces for git over Solid
---

# Git on Solid

> *Let Solid be Solid, and let Git be Git.*

Git repositories on Solid pods enable agent workflows, versioned data, and lightweight collaboration. Two architectural patterns are emerging, with materially different security properties. This page explains both, recommends one, and documents JSS's design.

## The architectural question

Git and Solid are different protocols with different security surfaces:

| Aspect | Solid | Git |
|--------|-------|-----|
| Resource model | URL-addressable resources | Content-addressed objects (SHA-keyed) |
| Access control | Per-resource (WAC, ACP) | Per-repository |
| State boundary | All resources URL-accessible by design | `.git/` is internal protocol state, not transport |
| Read pattern | `GET` single resource | `git clone` (full object graph in one operation) |

Composing them admits two patterns.

## Pattern A — URL-flattening

Store the working tree (including `.git/`) as Solid resources. Each file in `.git/` becomes individually addressable via Solid's normal serving semantics.

**Pros**

- No extra server tooling
- Uses Solid's native serving model

**Cons**

- Exposes `.git/HEAD`, refs, packed objects, and the entire object graph as URL-accessible
- Read access to any one piece yields the full repository history
- Git's repo-level access model is replaced by Solid's per-resource ACL, which cannot naturally express "all of `.git/` is internal"

## Pattern B — Protocol gateway (JSS's approach)

Serve git through `git-http-backend` (smart-HTTP). Block direct `.git/` URL access at the server layer.

**Pros**

- Preserves git's repo-level access model
- Clients use the standard `git clone`/`push`/`pull` protocol
- `.git/` internals are not URL-addressable
- Atomic operations (push, fetch) preserved
- Standard tooling works

**Cons**

- Requires server-side git tooling

## Why this matters

Mixing protocols by URL-flattening one into another is a recurring web anti-pattern. Examples from history:

| Mixed protocols | Resulting vulnerability |
|-----------------|--------------------------|
| HTTP + filesystem (early CGI) | Path traversal, `.htaccess` exposure |
| HTTP + database | SQL injection |
| HTTP + shell | Command injection |
| HTTP + serialised objects | Deserialisation RCE |

The general principle: **a protocol's "internal state" boundary should not become another protocol's "publicly addressable" surface.**

For git, this matters specifically because the entire repo history is *always* present in `.git/`. There is no way to use Solid's per-resource ACL to expose "just the latest version" — once any `.git/objects/...` is reachable, the full DAG is reachable.

## Security comparison

### Pattern A — what is exposed

| Asset | Mechanism | Severity |
|-------|-----------|----------|
| Full repository history | Pack files in `.git/objects/pack/`; loose objects via SHA | Critical |
| Author identities (name + email per commit) | Commit objects | High |
| Credentials accidentally committed | History retention; recoverable from object graph | High |
| Branch / project metadata | `.git/refs/`, `.git/packed-refs` | Medium |
| Active work / staged changes | `.git/index`, `.git/COMMIT_EDITMSG` | Medium |
| Search-engine indexability | Public pods become discoverable via `inurl:.git/HEAD` | Medium |
| Remote URLs (sometimes with credentials) | `.git/config` | Medium |

Solid per-resource ACL **cannot** express git's repo-level model. Granting or revoking read access requires:

- Listing every object SHA (changes constantly)
- Setting ACL on each new object as commits arrive
- Race conditions between commits and ACL updates
- New objects from new commits inherit container default ACL

The result: either over-grant (effectively public read) or break repo functionality. Stable middle states do not exist.

### Pattern B — what is mitigated

| Risk | Mitigated by |
|------|--------------|
| Full history disclosure | Repo accessed only via `git clone`, auth-gated at protocol entry |
| `.git/` enumeration | Server returns `403`/`404` for direct `.git/` paths |
| Search engine indexing | `.git/` is not a URL surface |
| ACL model mismatch | Auth at repo entry; git's own model takes over |
| Race conditions | Git protocol handles atomicity |
| History rewriting via direct ref writes | All ref updates go through `git-http-backend`'s checks |

Pattern B reduces the attack surface to **git's normal one** — well-understood, well-mitigated, well-documented.

Limitations of Pattern B (these are inherent to git itself, not introduced by Solid):

- A user who clones a public repo still receives full history, including any sensitive data committed in past versions
- Forks may persist after deletion
- Mitigations (history rewriting via `filter-branch` / BFG, secret scanning) are the same as for any git host

## JSS reference pattern

JSS implements Pattern B:

1. Git repositories are stored under a configured path (default: `~/.jss/git/`)
2. Solid auth (WebID + Schnorr / OIDC) is verified at the repo entry
3. Authorised requests are passed to `git-http-backend` for protocol handling
4. `.git/` paths are blocked at the server layer
5. Standard `git clone`, `git push`, `git pull` work over HTTPS

Minimal worked example:

```bash
# Server side
jss --git --git-path ~/.jss/git

# Client side
git clone https://alice.jss.live/repo/myproject.git
cd myproject
# ... edit, commit, push as normal
git push origin main
```

Authentication is handled per the [Git Push with Nostr](./git-push-nostr.md) guide.

## Browser viewer

[JSS Git](https://jss.live/git/) is the browser-side companion to Pattern B — a web app that browses any compliant git remote (including JSS-hosted pods) over standard smart-HTTP.

```
https://jss.live/git/?repo=https://your.pod/path/to/repo
```

Features:

- File tree with folder navigation, file-type icons, syntax highlighting
- Markdown rendering for READMEs (with shields.io badges, code blocks)
- Commits view with full history and per-commit detail (changed files, parents)
- Branch dropdown for multi-branch repos
- Repo header with breadcrumb, sidebar with About / branch / clone snippet
- OGP previews when sharing repo URLs

Architecturally, JSS Git is a pure smart-HTTP client (via [isomorphic-git](https://isomorphic-git.org)) — the same protocol JSS speaks server-side. No `.git/` path-walking, no raw object fetching: handles packed refs, pack files, and delta compression like any standard git client.

Source: [github.com/JavaScriptSolidServer/git](https://github.com/JavaScriptSolidServer/git)

## Server-side dotfile policy

JSS recommends blocking dotfile paths at the server layer by default:

| Path pattern | Reason |
|--------------|--------|
| `.git/` | Repository internal state |
| `.env` | Configuration secrets |
| `.ssh/` | SSH credentials |
| `.aws/` | Cloud credentials |
| `.netrc` | HTTP credentials |
| `.well-known/` | Allowed only for specific known endpoints |

This is long-standing best practice in web server configuration (Apache, nginx, Caddy all support this). Solid pods inherit the same risk class because they are URL-addressable resources.

## Further reading

- [JSS Git](https://jss.live/git/) — browser frontend for Pattern B repos
- [Git Push with Nostr](./git-push-nostr.md) — practical setup guide
- [JSS Issue #28](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/28) — original `.git/` exposure security report
- [Reference implementation gist](https://gist.github.com/melvincarvalho/054479068a699dcde97bbd9046ae247b) — `git-http-backend` integration pattern
- [docs Issue #1](https://github.com/JavaScriptSolidServer/docs/issues/1) — design discussion for this page

## Philosophy

Composition by gateway, not by URL-flattening. Each protocol keeps its model. The boundary is where security lives.

> *Let Solid be Solid, and let Git be Git.*
