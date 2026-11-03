---
title: Mind Maps
sidebar_position: 7
---

# Mind Maps

Every part of JSS is also a mind map you can open in [Mindstr](https://mindstr.org):
the docs, the CLI, the source tree, the plugins, the org's repos and their open issues.
The maps are generated from the real sources, so they are as current as the last build.

**Open the root map:**
[mindstr.org/?uri=https://jss.live/docs/mindstr/index.jsonld](https://mindstr.org/?uri=https://jss.live/docs/mindstr/index.jsonld)

Click a node's link mark to open the page, file, issue or child map it points at. The
`←` node at the bottom of every map goes back up.

## Where the maps live

The convention is a `/mindstr/` folder next to the content it describes:

| URL | What it is |
| --- | --- |
| `https://jss.live/docs/mindstr/index.jsonld` | The root map. Always the entry point. |
| `https://jss.live/docs/mindstr/outline.md` | The whole set as one nested Markdown outline, with every link. For people and LLMs. |
| `https://jss.live/docs/mindstr/<name>.jsonld` | One map per section, page, module, plugin, repo or issue group. |

Any map can be opened directly: `https://mindstr.org/?uri=<map url>`. Maps link to each
other with relative links, so the folder can be copied or mirrored intact.

The same convention works for any site or repo: put `index.jsonld` and `outline.md` under
`/mindstr/` and anyone can open it the same way.

## What is in the set

| Maps | Built from |
| --- | --- |
| Docs | This site's sidebar, pages and headings, each node linking to the page section |
| CLI | `jss --help` and every subcommand's help: commands, option groups, options |
| Source | `src/` modules, files and exported functions, linking to the line on GitHub |
| Plugins | The [plugins](https://github.com/JavaScriptSolidServer/plugins) repo: each plugin's README and `plugin.js` |
| Repos | Every repo in the org, from its README |
| Issues | Open issues per repo, grouped by label and by month last updated |

## For agents

Read `outline.md` first: it is one file, every line has a link, and it covers the whole
set. Open a map only when you need its structure. The map format is documented in
Mindstr's [SPEC.md](https://github.com/melvincarvalho/mindstr/blob/gh-pages/SPEC.md);
JSON-LD 0.2 with `parent` links, so the tree is readable in place.
