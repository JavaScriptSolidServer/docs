---
sidebar_position: 15
title: LWS / Controlled Identifiers
description: W3C Linked Web Storage 1.0 + Controlled Identifiers v1.0 alignment
---

# LWS / Controlled Identifiers

JSS is aligned end-to-end with the W3C [Linked Web Storage 1.0 Authentication Suite](https://www.w3.org/news/2026/first-public-working-drafts-for-the-linked-web-storage-lws-1-0-authentication-suite/) (FPWDs published 2026-04-23) and its substrate, [W3C Controlled Identifiers v1.0](https://www.w3.org/TR/cid-1.0/) — pod profiles are CID-shaped, users add keys via the [doctor](https://jss.live/doctor/), and the server accepts strict LWS10-CID JWTs as an HTTP auth method alongside the existing Solid-OIDC and NIP-98 paths.

Convergence tracker: [JSS#386](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/386). FPWD-alignment audit: [JSS#319](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/319).

## Compatibility, by level

| | What it means | Status |
|---|---|---|
| **1. Profile shape** | A WebID profile that's structurally a W3C Controlled Identifier document — right `@context`, right vocabulary, parseable as a CID document by any LWS-aware tool | ✅ Shipped in JSS 0.0.174 ([JSS#388](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/388)) |
| **2. Profile carries keys** | The CID document declares `verificationMethod` entries an LWS verifier can look up by `kid` | ✅ Browser-side via the [doctor](https://jss.live/doctor/) — [B.2](https://github.com/JavaScriptSolidServer/doctor/pull/2) for Nostr/Multikey, [B.3](https://github.com/JavaScriptSolidServer/doctor/pull/4) for ES256K/JsonWebKey. Authenticates as the WebID owner via Solid-OIDC and PATCHes the VM into the profile. |
| **3. Server accepts LWS-CID JWTs** | An incoming request with an LWS10-CID self-signed JWT (`sub`/`iss`/`client_id` triple-equality, `kid` lookup against the WebID's `verificationMethod`, signature check) authenticates as the WebID | ✅ Shipped in JSS 0.0.177 ([JSS#398](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/398)). Strict FPWD §4 — ES256K is the focus algorithm; ES256, ES384, EdDSA, RS256 also accepted. |
| **Bonus: NIP-98 → WebID** | A Schnorr-signed NIP-98 request authenticates as the WebID (not `did:nostr:`) when the pubkey is declared as a CID `verificationMethod` referenced from `authentication` | ✅ Shipped in JSS 0.0.178 ([JSS#400](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/400)). No client-side change — the doctor's B.2 output is enough to light it up. |

## What you can do today

1. **Inspect any WebID profile.** Open the [doctor](https://jss.live/doctor/), paste a WebID URL, see a pass/warn/fail/skip checklist of the CID v1 vocabulary, controller predicate, verificationMethod entries, alsoKnownAs DIDs, etc.
2. **Add keys to your WebID profile.** Two paths in the doctor, side by side: B.2 emits a Nostr `Multikey` VM (for did:nostr binding and NIP-98 lookup) from a [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) signer; B.3 emits a `JsonWebKey` VM (for ES256K LWS-CID JWT auth) from a 32-byte secp256k1 hex private key. Sign in via Solid-OIDC, doctor PATCHes via authenticated GET-merge-PUT (with `If-Match`).
3. **Sign in via three auth methods.** Solid-OIDC (existing), LWS10-CID JWT (new in 0.0.177 — `Authorization: Bearer <jwt>` with a `kid` pointing at a VM in your profile), or NIP-98 (existing, now upgrades to WebID in 0.0.178 when your Nostr pubkey is in your profile's `verificationMethod`).

## Profile shape (Phase A — what's emitted at pod creation, JSS 0.0.174+)

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

`verificationMethod` / `authentication` / `assertionMethod` arrays are empty until you add keys via the doctor.

The CID vocabulary is declared **inline** rather than via the `https://www.w3.org/ns/cid/v1` imported context URL — JSS's JSON-LD → Turtle conneg layer can't resolve external context URLs, and we deliberately don't fetch them at request time (SSRF, latency, cache complexity). Tracked in [JSS#389](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/389).

## Adding keys (Phase B — via the doctor)

The [doctor](https://jss.live/doctor/) signs in to your pod via Solid-OIDC and writes verificationMethod entries to your profile. After the round-trip your profile carries:

```jsonld
"verificationMethod": [
  {
    "id":   "https://alice.example.com/profile/card.jsonld#nostr-key-1",
    "type": "Multikey",
    "controller": "https://alice.example.com/profile/card.jsonld#me",
    "publicKeyMultibase": "fe70102…"
  },
  {
    "id":   "https://alice.example.com/profile/card.jsonld#lws-key-1",
    "type": "JsonWebKey",
    "controller": "https://alice.example.com/profile/card.jsonld#me",
    "publicKeyJwk": { "kty": "EC", "crv": "secp256k1", "alg": "ES256K", "x": "…", "y": "…" }
  }
],
"authentication": [
  "https://alice.example.com/profile/card.jsonld#nostr-key-1",
  "https://alice.example.com/profile/card.jsonld#lws-key-1"
]
```

The Multikey entry handles did:nostr binding + NIP-98 lookup; the JsonWebKey entry handles strict LWS10-CID JWT auth. Both can be the same secp256k1 key — different signature schemes (Schnorr vs ECDSA), same private key.

Because the JSS profile already declares the context terms, this is a pure data-layer PATCH — no `@context` rewrite needed.

## Server-side verifier (Phase 3 — `src/auth/lws-cid.js`)

When an incoming request carries an LWS-CID JWT (detected by an `Authorization: Bearer <jwt>` whose JWT-header `kid` is an http(s) URL with a fragment), JSS:

1. Confirms `sub === iss === client_id` (canonicalized via URL parsing) — that URI is the WebID being claimed
2. Validates `aud` includes the server origin, `exp` not past, `iat` recent, lifetime ≤ 1 hour
3. Fetches the WebID profile through the shared SSRF guard — manual redirects with same-origin enforcement, 256 KB body cap, bounded LRU cache
4. Confirms the profile's `@id` equals the JWT's `sub` (closes a profile-substitution attack)
5. Looks up `kid` in `verificationMethod`; the entry must be referenced from `authentication` and its `controller` must match the profile's outer `controller`
6. Verifies the JWT signature per RFC7515 §5.2. ES256K via `@noble/curves` (already in tree from NIP-98); ES256, ES384, EdDSA, RS256 via `jose`

The verifier joins the existing auth methods (Solid-OIDC, NIP-98, Bearer-JWT-from-IDP, WebID-TLS) — preference order is OIDC → LWS-CID → NIP-98 → Bearer fallback (per [JSS#306](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/306)).

## NIP-98 → WebID upgrade (`src/auth/nostr.js`)

Built on top of the LWS-CID infrastructure ([JSS#400](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/pull/400)): when a NIP-98 request's signing pubkey is declared as a CID `verificationMethod` (and the VM is in `authentication`) on the resource owner's WebID profile, the request authenticates as the WebID instead of `did:nostr:<pubkey>`. Match is by f-form Multikey or by JsonWebKey full-point (x AND y, BIP-340 even-y). Profile fetch uses the same SSRF guard / cache as the LWS-CID verifier. No client-side change — Nostr clients sign as today.

So: anyone who's used the doctor's B.2 to add a Nostr Multikey VM gets WebID-based NIP-98 sign-in for free.

## Spec references

- [W3C CID v1.0 — Controlled Identifiers](https://www.w3.org/TR/cid-1.0/)
- [LWS 1.0 SSI via CID (FPWD 2026-04-23)](https://www.w3.org/TR/2026/WD-lws10-authn-ssi-cid-20260423/)
- [LWS 1.0 SSI via did:key (FPWD 2026-04-23)](https://www.w3.org/TR/2026/WD-lws10-authn-ssi-did-key-20260423/)
- [W3C announcement](https://www.w3.org/news/2026/first-public-working-drafts-for-the-linked-web-storage-lws-1-0-authentication-suite/)
- [RFC 8812 — ES256K JWS algorithm](https://www.rfc-editor.org/rfc/rfc8812)
- [did:nostr DID Method Specification](https://nostrcg.github.io/did-nostr/)
- [w3c-ccg/community#254](https://github.com/w3c-ccg/community/issues/254#issuecomment-3148690444) — context for the f-form Multikey recipe

## See also

- [Authentication](./authentication.md) — full JSS auth surface (OIDC, NIP-98, LWS-CID, passkey, etc.)
- [Nostr Relay](./nostr.md) — Nostr relay + did:nostr resolution
- [End-to-End Encryption](./e2ee.md) — NIP-44 / NIP-04 over `did:nostr` keys
- [doctor](https://github.com/JavaScriptSolidServer/doctor) — the browser-side diagnostic + add-keys app
