---
sidebar_position: 15
title: LWS / Controlled Identifiers
description: W3C Linked Web Storage 1.0 + Controlled Identifiers v1.0 alignment
---

# LWS / Controlled Identifiers

JSS pod profiles are aligned with the W3C [Linked Web Storage 1.0 Authentication Suite](https://www.w3.org/news/2026/first-public-working-drafts-for-the-linked-web-storage-lws-1-0-authentication-suite/) (FPWDs published 2026-04-23) and its substrate, [W3C Controlled Identifiers v1.0](https://www.w3.org/TR/cid-1.0/).

The work is phased — JSS-side issue [#386](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/386) is the convergence tracker and [#319](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/319) is the FPWD-alignment audit.

> **Status: stub / evolving.** This page documents the current state honestly. As Phase B (the standalone "add my keys" app) and Phase 3 (the server-side LWS-CID JWT verifier) ship, this page will fill out.

## Three levels of compatibility

| | What it means | Status |
|---|---|---|
| **1. Profile shape** | A WebID profile that's structurally a W3C Controlled Identifier document — right `@context`, right vocabulary, parseable as a CID document by any LWS-aware tool | ✅ Shipped in JSS 0.0.174 |
| **2. Profile carries keys** | The CID document actually declares `verificationMethod` entries an LWS verifier can look up by `kid` | ❌ Phase B — separate "doctor / add-keys" app PATCHes them in after authentication |
| **3. Server accepts LWS-CID JWTs** | An incoming request with an LWS-CID self-signed JWT (`sub`/`iss`/`client_id` triple-equality, `kid` lookup against the WebID's `verificationMethod`, signature check) | ❌ Phase 3 of [JSS#386](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/386) — JSS still only knows OIDC/DPoP, NIP-98, passkey, simple bearer |

So: **structurally yes, functionally not yet.** A new pod's WebID can be dereferenced and parsed as a CID document. End-to-end LWS auth — client signs a JWT with their key, server verifies via the profile — needs both keys in the profile (Phase B) and a verifier in JSS (Phase 3).

## What ships today (JSS 0.0.174+)

`src/webid/profile.js` declares the six CID v1 vocabulary terms in the profile's `@context` and emits a `controller` triple pointing at the WebID itself per CID v1's self-control contract:

```jsonld
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/",
    "solid": "http://www.w3.org/ns/solid/terms#",
    "cid": "https://www.w3.org/ns/cid/v1#",
    "lws": "https://www.w3.org/ns/lws#",
    "controller":         { "@id": "cid:controller", "@type": "@id" },
    "verificationMethod": { "@id": "cid:verificationMethod", "@container": "@set" },
    "authentication":     { "@id": "cid:authentication", "@type": "@id", "@container": "@set" },
    "assertionMethod":    { "@id": "cid:assertionMethod", "@type": "@id", "@container": "@set" },
    "publicKeyJwk":       { "@id": "cid:publicKeyJwk", "@type": "@json" },
    "publicKeyMultibase": { "@id": "cid:publicKeyMultibase" }
  },
  "@id": "https://alice.example.com/profile/card.jsonld#me",
  "@type": ["foaf:Person"],
  "controller": "https://alice.example.com/profile/card.jsonld#me"
}
```

`verificationMethod` / `authentication` / `assertionMethod` arrays are intentionally absent until Phase B's add-keys app PATCHes them in.

The CID vocabulary is declared **inline** rather than via the `https://www.w3.org/ns/cid/v1` imported context URL — JSS's JSON-LD → Turtle conneg layer can't resolve external context URLs, and we deliberately don't fetch them at request time (SSRF, latency, cache complexity). Tracked in [JSS#389](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/389).

## What Phase B will add

A standalone web app — separate repo, no JSS coupling — where the WebID owner authenticates via existing means (OIDC, NIP-98, passkey) and PATCHes their profile with one or more verification methods. Three illustrative key types:

```jsonld
"verificationMethod": [
  {
    "id":   "https://alice.example.com/profile/card.jsonld#nostr-1",
    "type": "Multikey",
    "controller": "https://alice.example.com/profile/card.jsonld#me",
    "publicKeyMultibase": "fe70102..."
  },
  {
    "id":   "https://alice.example.com/profile/card.jsonld#did-key-1",
    "type": "Multikey",
    "controller": "https://alice.example.com/profile/card.jsonld#me",
    "publicKeyMultibase": "z6MkpT..."
  },
  {
    "id":   "https://alice.example.com/profile/card.jsonld#passkey-1",
    "type": "JsonWebKey",
    "controller": "https://alice.example.com/profile/card.jsonld#me",
    "publicKeyJwk": { "kty": "EC", "crv": "P-256", "x": "...", "y": "..." }
  }
],
"authentication": [
  "https://alice.example.com/profile/card.jsonld#nostr-1",
  "https://alice.example.com/profile/card.jsonld#did-key-1",
  "https://alice.example.com/profile/card.jsonld#passkey-1"
]
```

Because the JSS profile already declares the context terms, this is a pure data-layer PATCH — no `@context` rewrite needed.

## What Phase 3 will add (server-side verifier)

When an incoming request carries an LWS-CID JWT, JSS will:

1. Confirm `sub`/`iss`/`client_id` are the same URI (the caller's WebID)
2. Dereference the WebID, parse it as a CID document
3. Look up `kid` in the document's `verificationMethod` array
4. Confirm the method is in `authentication`
5. Verify the JWT signature with that public key

The verifier joins the existing auth methods (OIDC, NIP-98, passkey, etc.). Auth-method preference ordering is tracked in [JSS#306](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/306).

## Spec references

- [W3C CID v1.0 — Controlled Identifiers](https://www.w3.org/TR/cid-1.0/)
- [LWS 1.0 SSI via CID (FPWD 2026-04-23)](https://www.w3.org/TR/2026/WD-lws10-authn-ssi-cid-20260423/)
- [LWS 1.0 SSI via did:key (FPWD 2026-04-23)](https://www.w3.org/TR/2026/WD-lws10-authn-ssi-did-key-20260423/)
- [W3C announcement](https://www.w3.org/news/2026/first-public-working-drafts-for-the-linked-web-storage-lws-1-0-authentication-suite/)
- [did:nostr DID Method Specification](https://nostrcg.github.io/did-nostr/)

## See also

- [Authentication](./authentication.md) — current JSS auth surface (OIDC, NIP-98, passkey, etc.)
- [Nostr Relay](./nostr.md) — Nostr relay + did:nostr resolution
- [End-to-End Encryption](./e2ee.md) — NIP-44 / NIP-04 over `did:nostr` keys
