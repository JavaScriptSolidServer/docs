---
sidebar_position: 4
title: Access Control (WAC)
description: Web Access Control with .acl files
---

# Access Control

JSS uses Web Access Control (WAC) for authorization via `.acl` files.

## How it works

Each resource or container can have an `.acl` file that defines who can access it and how.

## ACL Structure

```turtle
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

# Owner has full access
<#owner>
    a acl:Authorization;
    acl:agent <http://localhost:3000/alice/#me>;
    acl:accessTo <./>;
    acl:default <./>;
    acl:mode acl:Read, acl:Write, acl:Control.

# Public can read
<#public>
    a acl:Authorization;
    acl:agentClass foaf:Agent;
    acl:accessTo <./>;
    acl:default <./>;
    acl:mode acl:Read.
```

## Access Modes

| Mode | Permission |
|------|------------|
| `acl:Read` | Read resources |
| `acl:Write` | Create, update, delete |
| `acl:Append` | Add to container only |
| `acl:Control` | Modify ACL files |

## Agent Types

- `acl:agent` - Specific WebID
- `acl:agentClass foaf:Agent` - Anyone (public)
- `acl:agentClass acl:AuthenticatedAgent` - Any authenticated user
