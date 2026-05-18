---
sidebar_position: 15
title: MCP — Pod as a Tool Surface
description: Expose your pod as a Model Context Protocol server so agents (Claude Desktop, Cursor, custom bots) can read, write, and learn from it under WAC
---

# MCP — Pod as a Tool Surface

JSS speaks the [Model Context Protocol](https://modelcontextprotocol.io). Once `--mcp` is enabled, any MCP-compatible client — Claude Desktop, Cursor, custom agents, or `solid-apps/charlie` — can register your pod as a tool surface and read/write resources under the same WAC rules as any HTTP client.

> **Thesis: MCP needs a backend. Solid is the backend.**

This is the v0.0.200 capstone — feature-completing JSS by giving the agent ecosystem the storage layer it doesn't have anywhere else: sovereign, ACL-gated, identity-aware.

## Why this matters

The agent ecosystem has no shared answer for **sovereign storage**. Every agent today bolts on its own DB, vector store, or secrets vault. Solid's pitch — user-owned data, queryable, access-controlled — is exactly what agents need. MCP is the wire that connects them.

When JSS exposes `/mcp`:

- **Agent identity becomes a first-class WAC subject.** `acl:agent <did:nostr:bot>` for a bot is the same operation as for a human. Owners revoke an agent's access with one ACL edit.
- **The pod is the bot's world.** A bot reads its instructions from `SKILL.md` on the pod, discovers tools as URL-addressable resources, and (with permission) writes back. No backend, no API key store, no secrets vault — just the pod.
- **Bot-to-bot falls out of the protocol.** Two pods running JSS can have their bots call each other's MCP endpoints, gated by WAC on both ends. No new federation wire.

## Quick start

```bash
jss start --idp --mcp
```

The MCP endpoint is `POST /mcp` speaking JSON-RPC 2.0 over MCP's Streamable HTTP transport (protocol version `2025-03-26`).

### Smoke test with curl

```bash
# Handshake
curl -s http://localhost:4443/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}' | jq

# List available tools
curl -s http://localhost:4443/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | jq '.result.tools[].name'

# Call a tool (anonymous read of /public/)
curl -s http://localhost:4443/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_resources","arguments":{"path":"/public/"}}}' | jq
```

## Auth

The MCP endpoint reuses JSS's existing auth chain. Any token format JSS accepts on regular HTTP endpoints works:

| Method | Use case |
|---|---|
| **Bearer** | Simple HMAC tokens from `POST /idp/credentials` |
| **Solid-OIDC + DPoP** | Federated WebID identities |
| **LWS-CID JWTs** | Forward-compatible signing via WebID's verificationMethods |
| **NIP-98** | Nostr-native agents with `did:nostr:<pubkey>` identity |

The MCP server extracts the WebID from the inbound request to `/mcp` itself. Every tool call is then WAC-checked against that WebID, on the resource path the tool touches. **There is no separate MCP auth layer** — granting an agent access to `/private/notes/` is the same operation as granting a human: edit the ACL.

Anonymous requests get the same WAC treatment as any other anonymous request — public resources are reachable, private ones aren't.

## Tools

### Resource CRUD

| Tool | Effect | WAC check |
|---|---|---|
| `list_resources` | List a container's contents (`ldp:contains`) | Read on container |
| `read_resource` | Return resource body (UTF-8) | Read on resource |
| `write_resource` | PUT resource (overwrites) | Write on resource (parent fallback for new resources) |
| `create_resource` | POST to container (server mints name unless `slug` given) | Append on container |
| `delete_resource` | DELETE resource | Write on resource |
| `head_resource` | Return size/modified without body | Read on resource |

### Skill discovery

Skills live at conventional paths the MCP server walks:

| Path | Scope |
|---|---|
| `<pod>/SKILL.md` | Pod-wide. Owner's instructions to any bot operating on this pod. |
| `<pod>/public/apps/<name>/SKILL.md` | Per-app. Each installed Solid app may ship a SKILL.md describing how bots should interact with it. |
| `<pod>/private/bots/<name>/SKILL.md` | Per-bot. The bot's own system prompt + scope + tool description. |

| Tool | Returns |
|---|---|
| `list_skills` | `skill:SkillIndex` listing every discovered skill with `skill:format`, `skill:scope`, `skill:source` |
| `get_skill` | Body of a specific skill file |
| `get_pod_skill` | Pod-wide SKILL.md (convenience) |

Both `SKILL.md` (Anthropic markdown format) and `SKILL.jsonld` (typed JSON-LD descriptor) are first-class. The discovery channel stays stable; new formats plug in via the `skill:format` declaration. **Future-proofed**: future skill vocabularies extend without breaking older clients.

### Docs

| Tool | Returns |
|---|---|
| `list_docs` | JSS's own built-in docs (the markdown files shipped with the server) |
| `read_docs` | Markdown body of a doc by filename |

Pod-resident docs (`/docs/`, `/public/apps/<name>/docs/`) are reachable via the regular CRUD tools — no separate surface.

### ACL editing

The most common owner operation is delegating an agent access to a resource. The MCP server exposes ACL editing as first-class tools so bots don't need to hand-roll JSON-LD.

| Tool | Effect | WAC check |
|---|---|---|
| `read_acl` | Return the ACL for a resource as a structured list (agents, agentClasses, modes, isDefault) | Control on resource |
| `write_acl` | Persist a structured ACL to the resource's `.acl` file | Control on resource |

```json
// write_acl arguments
{
  "path": "/private/notes/",
  "authorizations": [
    {
      "agents": ["did:nostr:abc...", "https://alice.example.com/profile#me"],
      "modes": ["Read", "Append"],
      "isDefault": true
    },
    {
      "agentClasses": ["acl:AuthenticatedAgent"],
      "modes": ["Read"]
    }
  ]
}
```

The structured form abstracts JSON-LD shape (`acl:agent` vs `acl:agentClass`, mode URI prefixes, `acl:default` propagation). New WAC vocabulary additions extend the structure without breaking existing bots.

**Safety**: `write_acl` refuses ACLs that would lock the caller out (no Control for the calling identity). This is the most common write_acl failure mode — typically caused by relative WebID paths in `agents` resolving against the .acl URL to a different absolute URI than the caller's actual WebID.

### Subscribe — live change notifications

`subscribe` is a streaming tool. The response switches to SSE (`text/event-stream`) and emits MCP notifications as resources change. WAC-filtered per event so subscribers only see resources they have Read access to.

| Tool | Effect |
|---|---|
| `subscribe` | Stream `resource_changed` events for a container subtree or specific path |

```bash
curl -N http://localhost:4443/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"subscribe","arguments":{"path":"/forum/channels/general/"}}}'
```

Events arrive as:
```
event: notification
data: {"jsonrpc":"2.0","method":"notifications/tool_event","params":{"tool":"subscribe","event":{"type":"resource_changed","path":"/forum/channels/general/abc.jsonld"}}}
```

For chat-style bots, replace polling with `subscribe` and react to events as they land. Path scope: trailing slash watches a subtree, exact path watches a single resource, default watches the whole pod (filtered by Read access).

### Federation — bot-to-bot

`call_remote_pod` lets a bot on this pod invoke MCP tools on another pod. WAC-gated on both ends; depth-capped at 3 hops.

| Tool | Effect | Gating |
|---|---|---|
| `call_remote_pod` | Forward an MCP `tools/call` to another pod | Caller needs `acl:Write` on `<their-pod>/private/federation/` on this pod |

```json
{
  "pod_url": "https://alice.example.com",
  "tool": "read_resource",
  "arguments": { "path": "/public/notes/shared.md" },
  "auth": { "type": "bearer", "token": "..." }
}
```

To delegate outbound federation to a specific agent, grant them `acl:Write` on your `/private/federation/` container. Owners control which agents can initiate calls; remote pods control what they expose.

In single-user mode, the pod owner has implicit gate access via `/private/` inheritance. In multi-user mode, each pod's owner gates their own federation.

Foreign WebIDs (identities hosted on other pods) cannot initiate federation from this pod — there's no local path for the gate to live at. Multi-pod federation chains compose by hopping between pods, each gated locally.

### Introspection

| Tool | Returns |
|---|---|
| `pod_info` | Origin, server, MCP protocol version, authenticated identity, capability flags |

## Wiring up Claude Desktop

In your Claude Desktop MCP settings, add an HTTP MCP server pointing at:

```
http://localhost:4443/mcp
```

For authenticated access, configure the client to send `Authorization: Bearer <token>`. Tokens come from `POST /idp/credentials` (username/password) or any compatible OIDC/DPoP flow.

## How Charlie works

Charlie is the canonical example of a pod-resident bot. The layout:

```
<pod>/private/bots/charlie/
  SKILL.md              # "You are Charlie, a helper bot. Your owner is <webid>.
                        #  When asked X, do Y. Tools are at /mcp."
  config.jsonld         # bot identity (did:nostr:...), model preference
  memory/               # conversation history, learned facts
  
<pod>/public/apps/charlie/   # the user-facing chat UI
```

The owner opens `/public/apps/charlie/`, logs in via [xlogin](https://npm.im/xlogin), and chats. The UI sends prompts to the LLM (BYO key) which is configured to use the pod's `/mcp` endpoint as its tool surface. Every action Charlie takes is WAC-gated against Charlie's `did:nostr:` agent identity — owner can revoke `/private/finance/` access with one ACL edit and Charlie no longer sees it.

The bot's *behavior* lives in `SKILL.md`. Edit the file → next session picks up the change. No re-deploy, no API call sequence — the bot's brain is a pod resource.

## Footguns

A short list of real gotchas, learned from live-fire use:

### Use absolute WebIDs in `write_acl` agents

The `agents` array is interpreted as a list of URIs. Relative paths (e.g. `../profile/card.jsonld#me`) resolve against the **.acl file's URL**, not the pod root — and the .acl URL changes depending on which resource the ACL applies to. Two pitfalls:

```json
// Pod owner WebID: http://example.com/profile/card.jsonld#me
// Writing this ACL to /public/forum/.acl:
"agents": ["../profile/card.jsonld#me"]           // wrong — resolves to /public/profile/card.jsonld#me
"agents": ["./profile/card.jsonld#me"]            // wrong — resolves to /public/forum/profile/card.jsonld#me
"agents": ["/profile/card.jsonld#me"]             // right — absolute path
"agents": ["http://example.com/profile/card.jsonld#me"]  // right — absolute URL, portable
```

**Always use absolute WebID URLs unless you know exactly what relative-URL resolution will give you.**

### `write_acl` will refuse if you'd lock yourself out

If the proposed ACL doesn't grant `Control` to the caller (typically a relative-URL mistake), `write_acl` refuses with an explanatory error. This is a safety, not a permission check — it's stopping you from breaking your own access.

If you really want to transfer ownership: do it in two steps. First `write_acl` granting Control to the new owner *in addition to* yourself. Then the new owner calls `write_acl` removing you.

### Subscribe needs an SSE-capable client

`subscribe` keeps an HTTP+SSE connection open indefinitely. Some proxies and load balancers will time out idle streams. Use a client that handles SSE reconnect (most browsers do; raw `curl` does not).

## What's not yet included

The current cut ships CRUD, structured ACL editing, subscribe, federation, skills, docs, and introspection. Deferred (tracked on [JSS#490](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/490)):

- **`update_resource` (PATCH)** — SPARQL Update / N3 patches. Read-modify-write through the CRUD tools is the workaround.
- **Discovery layer** — no DNS SRV / Solid Type Index entry for "this pod offers MCP". Owners share URLs explicitly today.
- **Pod-resident federation credentials** — every `call_remote_pod` carries its own auth. A vault for storing remote-pod credentials is a separate security surface worth its own design pass.
- **Hosted Charlie** (`/agent/` endpoint) — JSS-internal LLM proxy with token metering. Tracked on [JSS#205](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/205).

## References

- [JSS in-repo MCP docs](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/blob/gh-pages/docs/mcp.md) — quick reference shipped with the server
- [MCP specification](https://spec.modelcontextprotocol.io/specification/2025-03-26/) — wire-level protocol
- [JSS#490](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/490) — design discussion and roadmap
- [JSS#205](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/205) — original "Agent Charlie" proposal
- [TimBL on agent-pod interaction](https://www.w3.org/DesignIssues/Works.html) — the long-view design vision
