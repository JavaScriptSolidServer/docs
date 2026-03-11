---
sidebar_position: 15
title: HTTP 402 Payments
description: Monetize pod resources with per-request sat payments and token trading
---

# HTTP 402 Payments

JSS includes a built-in payment system. Resources under `/pay/*` cost satoshis to access. Users authenticate with a Nostr key (NIP-98), deposit sats from a Bitcoin UTXO, and spend them on API requests. Optionally, the pod can mint its own token for buying, selling, and trading.

## Quick Start

```bash
jss start --pay --pay-cost 1
```

Put a resource behind the paywall:

```bash
curl -X PUT http://localhost:3000/pay/hello.json \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from the paid zone"}'
```

Now accessing `GET /pay/hello.json` requires NIP-98 authentication and 1 sat of balance.

## Configuration

| Flag | Description | Default |
|------|-------------|---------|
| `--pay` | Enable HTTP 402 for `/pay/*` routes | `false` |
| `--pay-cost <n>` | Cost per request in satoshis | `1` |
| `--pay-mempool-url <url>` | Mempool API URL for deposit verification | testnet4 |
| `--pay-address <addr>` | Address for receiving MRC20 token deposits | - |
| `--pay-token <ticker>` | Token to sell (enables buy/withdraw/sell/swap) | - |
| `--pay-rate <n>` | Sats per token for buy/withdraw | `1` |

### Environment Variables

```bash
export JSS_PAY=true
export JSS_PAY_COST=1
export JSS_PAY_MEMPOOL_URL=https://mempool.space/testnet4
export JSS_PAY_ADDRESS=tb1q...
export JSS_PAY_TOKEN=PODS
export JSS_PAY_RATE=10
```

## API Endpoints

### Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pay/.info` | Payment config: cost, token info, available routes |
| GET | `/pay/.offers` | Open sell orders (secondary market) |

### Authenticated (NIP-98)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pay/.balance` | Check your sat balance |
| POST | `/pay/.deposit` | Deposit sats (TXO URI) or MRC20 tokens |
| POST | `/pay/.buy` | Buy tokens with sat balance |
| POST | `/pay/.withdraw` | Withdraw balance as portable tokens |
| POST | `/pay/.sell` | Create a sell order |
| POST | `/pay/.swap` | Execute a swap against a sell order |
| GET | `/pay/*` | Access a paid resource (deducts balance) |

## How It Works

### 1. Discover

```bash
curl https://example.com/pay/.info
```

```json
{
  "cost": 1,
  "unit": "sat",
  "deposit": "/pay/.deposit",
  "balance": "/pay/.balance",
  "token": {
    "ticker": "PODS",
    "rate": 10,
    "buy": "/pay/.buy",
    "withdraw": "/pay/.withdraw"
  }
}
```

### 2. Authenticate

All authenticated requests use NIP-98 — a Nostr event (kind 27235) signed with your private key:

```
Authorization: Nostr <base64-encoded-event>
```

The event must include tags `["u", "<request-url>"]` and `["method", "<HTTP-METHOD>"]`.

### 3. Deposit

Post a confirmed Bitcoin transaction output to credit your balance:

```bash
curl -X POST -H "Authorization: Nostr <token>" \
  https://example.com/pay/.deposit \
  -d "txid:vout"
```

The server verifies the UTXO via the mempool API and credits the output value to your balance.

### 4. Access Resources

```bash
curl -H "Authorization: Nostr <token>" \
  https://example.com/pay/my-resource.json
```

Each request deducts the configured cost. Response includes `X-Balance` and `X-Cost` headers. If your balance is too low, you get a `402 Payment Required` response:

```json
{
  "error": "Payment Required",
  "balance": 0,
  "cost": 1,
  "deposit": "/pay/.deposit"
}
```

## Token Economy

When `--pay-token` is configured, the pod mints its own MRC20 token anchored to Bitcoin via [blocktrails](https://blocktrails.org/) key chaining.

### Mint a Token (CLI)

```bash
jss token mint --ticker PODS --supply 10000 \
  --voucher "txo:btc:<txid>:<vout>?amount=<sats>&key=<hex>"
```

This creates a genesis MRC20 state, derives a taproot address via BIP-341 key chaining, and broadcasts a Bitcoin transaction anchoring the token.

### Primary Market

Users buy tokens from the pod at the configured rate:

```bash
curl -X POST -H "Authorization: Nostr <token>" \
  -H "Content-Type: application/json" \
  https://example.com/pay/.buy \
  -d '{"amount": 100}'
```

The pod deducts sats from the buyer's balance, advances the MRC20 trail on Bitcoin, and returns a portable proof:

```json
{
  "bought": 100,
  "ticker": "PODS",
  "cost": 1000,
  "rate": 10,
  "txid": "c3183f41...",
  "proof": {
    "state": { "..." },
    "prevState": { "..." },
    "anchor": {
      "pubkey": "025e60b6...",
      "stateStrings": ["..."],
      "network": "testnet4"
    }
  }
}
```

The proof is independently verifiable — anyone can derive the expected taproot address from the pubkey + state chain and check the Bitcoin UTXO.

### Withdrawal

Convert your balance back to portable tokens:

```bash
# Withdraw specific amount
curl -X POST -H "Authorization: Nostr <token>" \
  -H "Content-Type: application/json" \
  https://example.com/pay/.withdraw \
  -d '{"tokens": 50}'

# Drain entire balance
curl -X POST ... -d '{"all": true}'
```

### Secondary Market

Users can trade tokens with each other through the pod:

**List tokens for sale:**
```bash
curl -X POST -H "Authorization: Nostr <token>" \
  -H "Content-Type: application/json" \
  https://example.com/pay/.sell \
  -d '{"amount": 100, "price": 1500}'
```

**Browse offers:**
```bash
curl https://example.com/pay/.offers
```

**Execute a swap:**
```bash
curl -X POST -H "Authorization: Nostr <token>" \
  -H "Content-Type: application/json" \
  https://example.com/pay/.swap \
  -d '{"id": "<offer-uuid>"}'
```

The pod transfers tokens from seller to buyer on the Bitcoin trail, debits the buyer's sats, and credits the seller's sats.

## Use Cases

- **Paid APIs** — AI agents, data feeds, premium content, all metered per-request
- **Agent Economy** — Agents self-provision access with a funded Bitcoin UTXO
- **Pod Monetization** — Pod owners mint tokens and sell access
- **Portable Credits** — Buy on one pod, withdraw, deposit on another
- **Micropayments** — No Lightning channels, no payment processor, just Bitcoin UTXOs

## Balance Tracking

Balances are stored in a [Web Ledger](https://webledgers.org/) at `/.well-known/webledgers/webledgers.json`, mapping `did:nostr:<pubkey>` URIs to sat amounts.

## Token Management (CLI)

```bash
# Mint
jss token mint --ticker PODS --supply 10000 --voucher <txo-uri>

# Transfer
jss token transfer --ticker PODS --to <pubkey> --amount 100

# Info
jss token info PODS
```

## Related

- [NIP-98 HTTP Auth](https://nips.nostr.com/98) — Authentication mechanism
- [Web Ledgers](https://webledgers.org/) — Balance tracking spec
- [Blocktrails](https://blocktrails.org/) — Bitcoin anchoring for MRC20 tokens
- [NIP-69](https://nips.nostr.com/69) — P2P order events (secondary market convention)
