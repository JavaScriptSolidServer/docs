---
sidebar_position: 6
title: Git Integration
description: Clone and push to pods via git protocol
---

# Git Integration

JSS includes a Git HTTP backend, allowing you to use standard git commands with pods.

## Enable Git support

```bash
jss start --git
```

## Clone a repository

```bash
git clone http://localhost:3000/alice/myrepo
```

Requires `acl:Read` permission.

## Push changes

```bash
cd myrepo
echo "Update" >> README.md
git add . && git commit -m "Update"
git push
```

Requires `acl:Write` permission.

## Auto-checkout

After a successful push to a non-bare repository, JSS automatically updates the working directory. No post-receive hooks needed.

## Git with Nostr Authentication

Use [git-credential-nostr](https://github.com/JavaScriptSolidServer/git-credential-nostr) for push authentication:

```bash
npm install -g git-credential-nostr
git-credential-nostr generate
git config --global credential.helper nostr
git config --global nostr.privkey <key>

# Generate ACL for your repo
cd myrepo
git-credential-nostr acl > .acl
git add .acl && git commit -m "Add ACL"
git push
```

See [Git Push with Nostr](/guides/git-push-nostr) for a complete guide.
