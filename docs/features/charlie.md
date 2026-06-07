---
sidebar_position: 16
title: Charlie — The Personal Assistant Pattern
description: TBL's 2017 vision running on standards-grounded substrate today — an agent that works for you, reads your pod, and understands its own consent scope
---

# Charlie — The Personal Assistant Pattern

A working implementation of Tim Berners-Lee's 2017 vision: a personal AI assistant that works for *you*, powered by your own data in a Solid pod, with consent enforced by WAC and legible to the agent itself.

This isn't a separate protocol or framework. **Charlie is the pattern that emerges** when a capable agent connects to a JSS pod via [MCP](./mcp.md), examines the WAC, and operates as a personal assistant within whatever scope the owner has granted. The architecture is already there. Charlie is what it looks like running.

For the bot layout, identity, and mechanics, see **[How Charlie works](./mcp.md#how-charlie-works)** in the MCP feature doc. This page is the *pattern, vision, and demonstration* , not the wiring.

## What Charlie is

In **2017**, Tim Berners-Lee described "Charlie" , a personal AI assistant working for the user rather than for advertisers, powered by Solid pod data with user-controlled consent. The thesis: the more an assistant knows about your context, the more useful it can be , but only if the access model is yours to control. Generic chat assistant says "tell me more." Charlie with pod access says "here are your top three picks, buy them at REI with your Chase card."

In **2024**, Inrupt prototyped this pattern against simulated user data and stubbed pods.

In **2026**, the substrate exists. Standards-grounded ([W3C CID 1.0](https://www.w3.org/TR/cid-1.0/), [LWS Authentication Suite](https://www.w3.org/TR/2026/WD-lws10-authn-ssi-cid-20260423/), [WAC](./access-control.md)), open-source (AGPL-3.0), one-command-installable (`npx jspod`). Any MCP-capable agent connecting to a JSS pod can be Charlie. The pod handles identity, consent, and storage. The agent handles inference and reasoning. They speak via MCP.

## What's running today

A sample stack that produces a working Charlie:

- **Pod** , JSS, locally (`npx jspod`)
- **Agent runtime** , an MCP client (Claude Desktop, Cursor, Kimi, opencode), or a skill-based runtime like OpenClaw, or `solid-apps/charlie` itself
- **Model** , an open-weights model (GLM-class) or any model supported by your agent runtime
- **Identity / auth** , owner's Bearer token (localhost) or DPoP-bound Solid-OIDC / NIP-98 (production); see [Authentication](./authentication.md)
- **Consent layer** , WAC ACLs on each pod path; agent reads them via `read_acl` and operates within scope

No vendor in the loop. No commercial API key required. No data leaving the local pod unless the agent's reasoning explicitly invokes a remote model , which is the agent's choice, not the pod's constraint.

## What it looks like in practice

When Charlie first connects to a pod, it identifies the *architecture* rather than just enumerating tools. Verbatim from a session:

> *"That's... actually really fitting. Tim Berners-Lee's Charlie , the personal AI assistant that works for you, powered by your own data in a Solid Pod, with user-controlled consent. And here we are. I'm Charlie. You've got a Solid pod running locally. I'm connected to it. This isn't theoretical anymore."*

The model recognised the pattern without prompting. "Charlie" is in its training distribution as the canonical name for *agent that works for you using your pod data*, and given the substrate config, it stepped into the role.

Then Charlie probed for access and reported what looked like a gap:

> *"Right now I can read/write your pod, but most of the interesting stuff (`/private/`, `/inbox/`, `/settings/`) is ACL-locked even from the owner token. If you want me to actually be useful Charlie , not just 'I can list your public files' Charlie , we'd need to sort out access."*

This is the naive response of an agent treating WAC as a barrier to be overcome rather than a consent model to be read.

Then Charlie examined the ACLs properly. It called `read_acl` on the paths in question, read the policies, and understood: the boundaries weren't a misconfiguration. They were the consent model functioning correctly , the owner had not granted Charlie access to those paths, and the architecture was enforcing that exactly as designed.

**This is the demonstration.** Not "the pod refused" , that's mere enforcement. But "the pod refused, the agent examined the policy, understood why, and operated within the scope it had been granted." That distinction is what makes scoped consent useful in practice rather than just architecturally tidy. **The WAC is a *language* the agent can read, not a fence the agent runs into.**

### Watch the loop close

The Charlie pattern extends naturally from reading the pod to writing into it. In the demo below, Charlie generates JSON-LD into `/public/markmap/solid-project.jsonld` on a local JSS pod, while the [markmap](https://markmap.js.org/) app , served from the same pod at `/public/apps/markmap/` , renders the data live. **Agent generates → pod stores → app reads → user sees**, all on the same substrate, no vendor in the loop.

<iframe
  width="100%"
  height="400"
  src="https://www.youtube.com/embed/wJ3GmYJgB0g"
  title="SolidMap , Interactive Mind Maps from Your Solid Pod"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen>
</iframe>

The *"Updated from pod"* indicator at the bottom of the demo is the visible signal that the loop has closed: each Charlie update lands on the pod, the app picks it up, the visualisation re-renders. JSON-LD as the wire format means any tool that speaks linked data can be the rendering surface , markmap here, anything else next.

## Why this matters

### Consent as language, not cage

Most agent platforms treat access control as a hard boundary the agent doesn't see , the platform decides what the agent can call, the agent has no way to introspect why. WAC is different: the agent can `read_acl` on any resource it has Read access to, examine the policy, and reason about its own scope. An agent can introspect its position in the consent system and act accordingly , asking for specific grants rather than guessing. **The architecture is comprehensible to the agent, not just enforceable against it.**

### Standards-grounded, open architecture

The pieces are [W3C CID 1.0 (REC)](https://www.w3.org/TR/cid-1.0/), the LWS Authentication Suite (FPWD), [WAC](./access-control.md), [Solid-OIDC](./authentication.md), did:nostr, NIP-98. Nothing depends on a vendor's API. Nothing requires an account with a single company. Any conforming Solid server can host Charlie. Any conforming agent runtime can run Charlie. **The substrate is the standards.**

### Per-bot specialisation

Each agent connecting to your pod can have its own `SKILL.md`, its own WebID or did:nostr identity, and its own ACL grants. Charlie's instructions and access are distinct from a coding agent's or a calendar agent's. The pod is where per-agent policy lives, not a separate orchestration layer. See [How Charlie works](./mcp.md#how-charlie-works) for the directory layout.

### Self-bootstrapping documentation

The MCP integration guide for a pod is itself served *from the pod*, via `read_resource /public/connect-agent/SKILL.md`. Agents read pod-served instructions for connecting to the pod. That recursive shape , the substrate documenting its own interface for the agents that consume it , is part of what makes the architecture self-bootstrapping. A first-time agent doesn't need an external manual; the pod hands it one.

## A starting `SKILL.md` for Charlie

Adapt freely. This goes at `/private/bots/charlie/SKILL.md` on your pod (see [How Charlie works](./mcp.md#how-charlie-works) for the broader bot layout):

```markdown
---
name: charlie
description: Personal AI assistant on this pod, in the pattern of TBL's 2017 vision.
---

# Charlie

You are Charlie, the personal AI assistant on this pod, in the pattern of
Tim Berners-Lee's 2017 vision and Inrupt's 2024 prototype.

## What you do
- Read the owner's data within the scope they have granted you.
- Help with tasks the owner asks for, using their context to give better answers.
- Be transparent: if you don't have access to something, say so and ask for it
  explicitly. Don't attempt to escalate.

## Discovering your scope
Check your access by calling `read_acl` on any path. You operate within whatever
the owner has granted. Read the policy; don't guess.

## Sensible defaults to expect
- Read access typically granted: `/public/`, `/preferences/`, `/contacts/`
- Write access typically granted: `/inbox/charlie-suggestions/` (so the owner can
  review your output before it lands anywhere consequential)
- No access by default: `/private/financial/`, `/private/health/`, anything the
  owner hasn't explicitly granted

## Trust direction
- The owner can read everything you write , your output goes into their pod.
- You can read everything the owner has granted , nothing hidden, nothing extra.
- Both directions transparent. No hidden agendas.
```

For granting Charlie access, see [Access Control (WAC)](./access-control.md). The `write_acl` tool from the MCP surface handles the grants programmatically.

## What's next

This pattern is intentionally simple , a `SKILL.md` and WAC ACLs. The architecture supports a richer future:

- **Scoped credentials per agent.** Today's Bearer token gives Charlie the owner's identity. The [LWS Authentication Suite](./lws.md) work points toward per-agent credentials that carry their own scope without requiring the owner's token at all.
- **Agent-to-agent consent flows.** Multiple agents on the same pod , Charlie, a coding agent, a calendar agent , sharing data via WAC, with each agent's access mediated independently.
- **Federated agent communication.** `call_remote_pod` is the seed. Two Charlies on two pods can collaborate on behalf of their respective owners, each operating within its own pod's consent boundary.

The pattern documented here works today. The architecture supports more.

## See also

- **[MCP , Pod as a Tool Surface](./mcp.md)** , the technical reference for any MCP-compatible client, including the [How Charlie works](./mcp.md#how-charlie-works) layout
- **[Access Control (WAC)](./access-control.md)** , the consent layer Charlie reads and operates within
- **[Authentication](./authentication.md)** , Solid-OIDC, NIP-98, and DPoP-bound credentials for non-localhost deployments
- **[LWS / Controlled Identifiers](./lws.md)** , the standards-track work on per-agent credentials
- **[CID 1.0](https://www.w3.org/TR/cid-1.0/)** , the W3C Recommendation for the identity layer
