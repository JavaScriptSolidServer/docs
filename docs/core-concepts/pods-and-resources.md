---
sidebar_position: 2
title: Pods and Resources
description: Understanding Solid's data model
---

# Pods and Resources

## What is a Pod?

A pod (Personal Online Data Store) is a user's data container. Each user gets their own pod with:

- A WebID profile (`/alice/#me`)
- Public and private containers
- Access control via ACL files

## Pod Structure

```
/alice/
├── index.html          # WebID profile (HTML with JSON-LD)
├── .acl                 # Root ACL
├── inbox/              # Notifications (public append)
├── public/             # Public files
├── private/            # Private files (owner only)
└── settings/           # User preferences
    ├── prefs
    ├── publicTypeIndex
    └── privateTypeIndex
```

## Resources

Resources are files within a pod. They can be:

- **RDF resources** - JSON-LD or Turtle documents
- **Non-RDF resources** - Images, PDFs, any file type

## Containers

Containers are directories that can contain resources and other containers. They're represented as LDP Basic Containers.
