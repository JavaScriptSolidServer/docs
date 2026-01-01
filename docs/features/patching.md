---
sidebar_position: 3
title: Patching Data
description: Update RDF data with N3 Patch or SPARQL Update
---

# Patching Data

JSS supports two PATCH formats for updating RDF resources.

## N3 Patch

Solid's native patch format:

```bash
curl -X PATCH http://localhost:3000/alice/public/data.json \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: text/n3" \
  -d '@prefix solid: <http://www.w3.org/ns/solid/terms#>.
      _:patch a solid:InsertDeletePatch;
        solid:inserts { <#data> <http://example.org/name> "New Value" }.'
```

### Insert and Delete

```
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
_:patch a solid:InsertDeletePatch;
  solid:deletes { <#data> <http://example.org/name> "Old Value" };
  solid:inserts { <#data> <http://example.org/name> "New Value" }.
```

## SPARQL Update

Standard SPARQL UPDATE protocol:

```bash
curl -X PATCH http://localhost:3000/alice/public/data.json \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/sparql-update" \
  -d 'PREFIX ex: <http://example.org/>
      DELETE DATA { <#data> ex:value 42 } ;
      INSERT DATA { <#data> ex:value 43 }'
```
