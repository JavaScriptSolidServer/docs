---
sidebar_position: 4
title: Pod Structure
description: Default pod layout and files
---

# Pod Structure

When a pod is created, JSS generates this structure:

```
/alice/
├── index.html          # WebID profile
├── .acl                 # Root access control
├── inbox/              # LDP inbox
│   └── .acl            # Public append
├── public/             # Public container
├── private/            # Private container
│   └── .acl            # Owner only
└── settings/           # Preferences
    ├── .acl            # Owner only
    ├── prefs           # User preferences
    ├── publicTypeIndex
    └── privateTypeIndex
```

## WebID Profile

`/alice/index.html` contains HTML with embedded JSON-LD:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://www.w3.org/ns/solid/context.jsonld",
    "@id": "#me",
    "@type": "Person",
    "name": "alice",
    "inbox": "inbox/",
    "preferencesFile": "settings/prefs",
    "storage": "./"
  }
  </script>
</head>
<body>...</body>
</html>
```

## Root ACL

`/alice/.acl` grants owner full access and public read:

```turtle
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<#owner>
    a acl:Authorization;
    acl:agent </alice/#me>;
    acl:accessTo <./>;
    acl:default <./>;
    acl:mode acl:Read, acl:Write, acl:Control.

<#public>
    a acl:Authorization;
    acl:agentClass foaf:Agent;
    acl:accessTo <./>;
    acl:default <./>;
    acl:mode acl:Read.
```

## Inbox ACL

`/alice/inbox/.acl` allows public append:

```turtle
<#public>
    a acl:Authorization;
    acl:agentClass foaf:Agent;
    acl:accessTo <./>;
    acl:mode acl:Append.
```
