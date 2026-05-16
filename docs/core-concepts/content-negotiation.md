---
sidebar_position: 3
title: Content Negotiation
description: JSS's position on content negotiation, and how RDF apps with standard HTTP conneg work first-class today
---

# Content Negotiation

JSS is committed to correctly implementing content negotiation so that **any app speaking JSON-LD works with JSS today**, and to remaining **future-proofed against the W3C standards track** as it evolves. JSS's conneg architecture is deliberately positioned to adopt forthcoming W3C specifications (LWS and beyond) natively when they reach Recommendation, without requiring deprecation of JSS-local conventions. This document describes JSS's current conneg behaviour, the principles behind it, and the direction the position may evolve.

## Design constraints

JSS's content-negotiation behaviour is derived from four constraints, each of which rules out a class of bad architectural choices:

1. **W3C-spec aligned and future-proofed** — implement current W3C recommendations; position to adopt forthcoming specifications (LWS, etc.) natively when they reach Recommendation; deliberately avoid JSS-local conventions that would require deprecation when standards land
2. **Backwards-compatible with the deployed web** — do not depend on HTTP semantics the actual web does not reliably deliver (e.g., `Content-Type` headers stripped or defaulted wrong across proxies, CDNs, browsers, and client libraries)
3. **Compatible with the deployed semantic web** — recognise the formats and media types used by [schema.org](https://schema.org), [ActivityPub](../features/activitypub.md), and the broader linked-data ecosystem
4. **JSON-LD first** — JSON-LD is the canonical internal serialization; other RDF formats are conneg-served representations of the same resource

These constraints triangulate to the behaviour below.

## Content negotiation is a negotiation

Content negotiation is by definition a two-way handshake between client and server: the client expresses its preferences via the `Accept` header, the server responds with what it can serve via the `Content-Type` header, and both sides honour the result. JSS implements its side of the negotiation correctly for the cases where the client implements theirs.

Any RDF application that participates in the conneg handshake — sending `Accept` for its desired RDF format and respecting `Content-Type` in the response — is a first-class client of JSS when `--conneg` is enabled. JSS provides bidirectional Turtle ↔ JSON-LD content negotiation on any resource with a recognised RDF extension: PUT as Turtle and read as JSON-LD, or PUT as JSON-LD and read as Turtle. The transcoding is transparent.

This covers the overwhelming majority of real-world RDF traffic, including apps using:

- Standard RDF extensions: `.jsonld`, `.ttl`, `.rdf`, `.n3`, `.nt`, `.nq`, `.trig`
- Solid convention dotfiles: `.acl`, `.meta` (treated as JSON-LD on disk per Solid convention)
- HTML resources with embedded JSON-LD data islands
- Container representations (JSON-LD by default, Turtle via `Accept` header)

Clients that do not participate in the negotiation — either by not sending `Accept` or by ignoring `Content-Type` responses — receive JSS's spec-correct default behaviour: stored bytes with the best content-type signal JSS has available from the URI extension, or `application/octet-stream` if no signal exists. JSS cannot negotiate unilaterally; negotiation requires both sides.

## A living position

JSS's content-negotiation position evolves with the W3C standards track. As specifications stabilise, JSS adopts them; where they leave room, JSS holds the conservative position rather than inventing local convention. The behaviour described in this document is the current state — alive, not frozen — and this document is updated as the position evolves.

Concretely:

- Where standards stabilise (e.g., LWS REC), JSS implements promptly and natively
- Where standards leave room (e.g., for non-extension typed resources today), JSS holds the conservative position rather than inventing local conventions
- Where deployed apps surface real-world needs, JSS may add handling that addresses them gracefully without compromising the spec posture
- This document is the source of truth for what JSS currently does

## Current behaviour

| Case | Behaviour |
|---|---|
| GET extensioned RDF resource (`.jsonld`, `.ttl`, `.rdf`) with `Accept: application/ld+json` | Returns JSON-LD; transcodes from Turtle if necessary (with `--conneg`) |
| GET extensioned RDF resource with `Accept: text/turtle` | Returns Turtle; transcodes from JSON-LD if necessary (with `--conneg`) |
| PUT extensioned RDF resource as either format → GET with `Accept` for the other | Bidirectional Turtle ↔ JSON-LD conneg, byte-faithful for the stored format, transcoded for the other (with `--conneg`) |
| GET `.acl` / `.meta` resources | Treated as JSON-LD-on-disk per Solid convention; conneg to other RDF formats works via the standard `--conneg` path |
| GET container resource | Container representation served as JSON-LD by default; Turtle via `Accept` header (with `--conneg`); HTML data-browser via `Accept: text/html` (with `--mashlib`) |
| GET extension-less resource with `Accept: */*` or no `Accept` | Returns stored bytes as `application/octet-stream` |
| GET extension-less resource with `Accept` for a specific RDF format | Currently returns stored bytes as `application/octet-stream`. Improvements to this case are under consideration as implementation pressure and the LWS specification work both progress. |
| GET non-RDF resource (`.html`, `.png`, `.css`, etc.) | Served with the corresponding `Content-Type`; conneg does not apply |

## Enabling conneg

```bash
jss start --conneg
```

Or via environment variable:

```bash
JSS_CONNEG=true jss start
```

The `--conneg` flag is opt-in to keep the default install minimal; deployments that want full bidirectional RDF conneg should enable it.

## Examples

Get a JSON-LD resource as Turtle:

```bash
curl -H "Accept: text/turtle" http://localhost:3000/alice/notes/today.jsonld
```

Get a Turtle resource as JSON-LD:

```bash
curl -H "Accept: application/ld+json" http://localhost:3000/alice/notes/today.ttl
```

Get a container listing as Turtle:

```bash
curl -H "Accept: text/turtle" http://localhost:3000/alice/notes/
```

Get a profile's HTML data-browser view:

```bash
curl -H "Accept: text/html" http://localhost:3000/alice/profile/card
```

## Why these choices

**URI extension as primary signal.** The URI travels reliably through every web intermediary — proxies, CDNs, caches, mobile runtimes, serverless gateways. The `Content-Type` request header does not — it is stripped, defaulted wrong, or overridden by countless layers of the deployed web. JSS uses URI extension as the primary content-type signal because it is the most reliable signal in practice. This is the same architectural choice made by Apache, nginx, IIS, and effectively every production-grade static or storage-oriented HTTP server.

**Octet-stream when type is genuinely unknown.** When JSS has no reliable type information for a resource, returning `application/octet-stream` is the HTTP-spec-correct safe default. JSS does not invent content-types from nothing — making up a type the server does not actually know is the failure mode that leads to security incidents and silent data corruption.

**No JSS-local metadata mechanism for extension-less typed resources.** The metadata layer for non-extension format declaration is what W3C [LWS](../features/lws.md) is currently specifying. JSS deliberately does not invent a local convention (sidecar files, extended attributes, parallel databases) because such inventions would either conflict with the LWS canonical mechanism when it lands, or require deprecation and migration once it does. Substrate-discipline favours waiting for the spec over front-running it with throw-away local conventions.

**JSON-LD as canonical internal.** Per constraint 4, JSON-LD is JSS's canonical serialization. Stored resources with RDF extensions are kept byte-faithfully in the format the client provided; the `--conneg` machinery transcodes between Turtle and JSON-LD on read as the `Accept` header requests. This preserves the client's original bytes (no lossy round-trips) while providing the format flexibility downstream consumers need.

## Future-proofing posture

Standards evolve. JSS's conneg architecture is designed to absorb W3C specifications natively as they land, rather than relying on JSS-local conventions that would require deprecation:

- **URI extension as primary signal** — pre-dates and survives any spec changes; remains reliable through any future standards work, and is independent of the metadata mechanism LWS specifies
- **No JSS-local metadata layer** — when LWS specifies the canonical mechanism for non-extension format metadata, JSS can adopt it with no migration of stored data and no deprecation of prior conventions
- **Standards-track engagement** — JSS contributors actively participate in LWS work, so the spec is informed by real-implementation pressure and JSS is positioned to adopt promptly

This posture means downstream consumers of JSS — apps, frameworks, integrators — invest in JSS confident that adopting it today does not require migration when the standards evolve.

## How it works

The conneg pipeline is enabled via the `--conneg` flag and lives in `src/rdf/conneg.js` in the [main JSS repository](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer) (Turtle ↔ JSON-LD transcoding via [rdflib.js](https://github.com/linkeddata/rdflib.js)). The content-type detection for stored resources is in `src/utils/url.js` (`getContentType`).

On read:

1. Server resolves the URI to a stored resource (filesystem path)
2. Server determines stored content-type from URI extension via the recognised-format table
3. Server compares `Accept` header against stored type and convertible types
4. Server returns:
   - Stored bytes if format matches (or `Accept: */*`)
   - Transcoded representation if a conneg conversion exists (Turtle ↔ JSON-LD)
   - Stored bytes as `application/octet-stream` if no recognised extension

On write (PUT / POST), JSS preserves the client-provided bytes byte-faithfully in storage with the URI extension intact. JSS does not transcode on write — the stored format is whatever the client provided, and conneg happens on read.

## Direction

As implementation pressure from production apps surfaces real-world needs, and as the LWS specification progresses through the W3C standards track, JSS's conneg surface may evolve to handle additional cases. Current candidates for consideration include:

- More expressive responses for unsatisfiable conneg requests on extension-less resources
- Native handling of extension-less typed resources once the W3C LWS metadata mechanism stabilises
- Recognition of additional RDF media types as the semantic-web ecosystem expands

Specific implementation choices are made when they become clear; this document is updated as they ship.

## References

- [HTTP/1.1 RFC 9110 §12](https://www.rfc-editor.org/rfc/rfc9110#section-12) — content negotiation
- [Solid Protocol §5.5](https://solidproject.org/TR/protocol) — content negotiation requirements
- [W3C LWS](https://www.w3.org/TR/lws/) — Linked Web Storage (in progress)
- [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)
- [Mapping http: and file: spaces (TBL Design Issues, 2015)](https://www.w3.org/DesignIssues/HTTPFilenameMapping.html) — background on the filesystem ↔ HTTP mapping question
- [JSS LWS implementation status](../features/lws.md)
- [JSON-LD First](./json-ld-first.md)
