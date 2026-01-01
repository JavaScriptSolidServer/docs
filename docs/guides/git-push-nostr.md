---
sidebar_position: 3
title: Git Push with Nostr
description: Set up Nostr-authenticated git push
---

# Git Push with Nostr

Use your Nostr identity to push to JSS repositories.

## Prerequisites

- JSS running with `--git` enabled
- Node.js installed

## Install credential helper

```bash
npm install -g git-credential-nostr
```

## Generate keypair

```bash
git-credential-nostr generate
```

Output:
```
Generated new Nostr keypair:

  Private key: a1b2c3...
  Public key:  d4e5f6...
  WebID:       did:nostr:d4e5f6...

Setup:
  git config --global nostr.privkey a1b2c3...
```

## Configure git

```bash
git config --global credential.helper nostr
git config --global nostr.privkey <your-private-key>
```

## Create repository ACL

```bash
cd myrepo
git-credential-nostr acl > .acl
git add .acl
git commit -m "Add ACL"
```

This creates an ACL with:
- Your Nostr identity as owner (full access)
- Public read access (for `git clone`)

## Push

```bash
git push origin main
```

The credential helper automatically generates a NIP-98 token. JSS verifies the signature and allows the push.

## How it works

1. Git requests credentials
2. `git-credential-nostr` generates a NIP-98 event (kind 27235)
3. Token sent as Basic Auth password
4. JSS verifies Nostr signature
5. Push proceeds if ACL allows
