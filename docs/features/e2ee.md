---
sidebar_position: 14
title: End-to-End Encryption
description: Encrypt pod content client-side using did:nostr + NIP-44 / NIP-04 — no server-side changes
---

# End-to-End Encryption

JSS pods can store end-to-end encrypted content **today, with zero server-side changes**. The same `secp256k1` keypair that authenticates a client via [`did:nostr`](./authentication.md) provides the ECDH primitive needed for [NIP-44](https://github.com/nostr-protocol/nips/blob/master/44.md) (recommended) or [NIP-04](https://github.com/nostr-protocol/nips/blob/master/04.md) (legacy) encryption. The pod stores ciphertext as ordinary RDF or blob content; JSS never sees plaintext.

The architectural shape: **the server is not in the trust boundary.** Encrypt before `PUT`, decrypt after `GET`. JSS's role is content-opaque storage — exactly what it does for unencrypted content.

## Architecture

![End-to-end encryption flow: clients derive a shared key via ECDH between their did:nostr keypairs, encrypt with NIP-44, PUT ciphertext to the pod, and GET ciphertext to decrypt locally; the pod never sees plaintext.](/img/e2ee-architecture.svg)

JSS does not implement encryption, decryption, or key management. The encryption boundary is between clients.

## Protocols

| Protocol | Cipher | Auth | Key derivation | When to use |
|----------|--------|------|----------------|-------------|
| **NIP-44** (v2) | ChaCha20 | HMAC-SHA256 | HKDF-SHA256 over ECDH | New applications |
| **NIP-04** | AES-256-CBC | None | Raw ECDH output | Backwards compatibility with older Nostr clients |

Both produce opaque bytes from the server's perspective; JSS stores them identically.

NIP-44 has length-hiding power-of-two padding and a versioned wire format — prefer it unless you need to interoperate with legacy clients.

## Recipe: encrypt-then-PUT

```js
import { nip44, getPublicKey } from 'nostr-tools'

// privKey: your secp256k1 secret (hex), peerPubKey: recipient's hex pubkey
const conversationKey = nip44.v2.utils.getConversationKey(privKey, peerPubKey)
const ciphertext = nip44.v2.encrypt('the secret message', conversationKey)

await fetch('https://alice.example.org/private/note', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/octet-stream',
    'Authorization': `Nostr ${nip98AuthHeader}`  // see Authentication
  },
  body: ciphertext
})
```

## Recipe: GET-then-decrypt

```js
const res = await fetch('https://alice.example.org/private/note', {
  headers: { 'Authorization': `Nostr ${nip98AuthHeader}` }
})
const ciphertext = await res.text()

const conversationKey = nip44.v2.utils.getConversationKey(myPrivKey, peerPubKey)
const plaintext = nip44.v2.decrypt(ciphertext, conversationKey)
```

The pod sees only ciphertext on `PUT` and serves only ciphertext on `GET`. Access control (via [WAC](./access-control.md)) gates *who can fetch the bytes*; encryption gates *who can read them*.

## Browser flow with a NIP-07 signer

NIP-07 signer extensions (xlogin, nos2x, Alby) expose `nip44.encrypt` / `nip44.decrypt` directly, so applications never touch the user's private key:

```js
const ct = await window.nostr.nip44.encrypt(peerPubKey, 'the secret message')
await fetch(podUrl, { method: 'PUT', body: ct, headers: { Authorization: nostrAuth } })

const res = await fetch(podUrl, { headers: { Authorization: nostrAuth } })
const pt = await window.nostr.nip44.decrypt(peerPubKey, await res.text())
```

NIP-04's `window.nostr.nip04.encrypt` / `.decrypt` work the same way for legacy paths.

## Threat model

- **JSS sees**: ciphertext, request metadata (URL, size, timing, requesting WebID).
- **JSS does not see**: plaintext, conversation keys, peer relationships beyond what the URL or ACL exposes.
- **Forward secrecy**: NIP-44 derives a conversation key from a long-term ECDH; rotating peer keys is the unit of compartmentalisation.
- **Authenticity**: NIP-44 includes HMAC; NIP-04 does **not** — a tampered NIP-04 ciphertext decrypts to garbage rather than failing cleanly. New code should use NIP-44.

## Why reuse Nostr primitives instead of designing a Solid-native E2EE protocol

The Nostr E2EE stack is already deployed at scale across funded teams with cross-implementation interoperability — White Noise (NIP-44 messenger), Damus, Amethyst, Iris, Coracle, and many others. NIP-44's design has had external cryptographic review, and NIP-04 ciphertext flows daily across the public relay network at scale.

Pointing JSS pods at these primitives reuses that maturity. The bridge from `did:nostr` identity to NIP-44/NIP-04 already exists architecturally — only the documentation step is missing.

Tracked upstream in [JSS#365](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/365) and discussed in [solid/specification#788](https://github.com/solid/specification/issues/788).

## See also

- [Authentication](./authentication.md) — how `did:nostr` and NIP-98 are wired into JSS
- [Nostr Relay](./nostr.md) — built-in relay and identity linking
- [NIP-44](https://github.com/nostr-protocol/nips/blob/master/44.md) — current E2EE spec
- [NIP-04](https://github.com/nostr-protocol/nips/blob/master/04.md) — legacy E2EE spec
- [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) — browser signer API
