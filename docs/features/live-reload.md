---
sidebar_position: 11
title: Live Reload
description: Auto-refresh browser on file changes, like Vite
---

# Live Reload

Edit a file, and the browser refreshes automatically. No manual refresh needed.

## Quick Start

```bash
jss start --live-reload --public --root ./mysite
```

Or with servejss (live reload is on by default):

```bash
npx servejss ./mysite
```

## How It Works

1. JSS watches your data directory for filesystem changes using `fs.watch` (recursive)
2. When a file changes (from your editor, `cp`, `curl`, or HTTP PUT), JSS detects it
3. JSS emits a WebSocket notification to all subscribers
4. A small script injected into HTML pages listens for notifications and triggers `location.reload()`

The entire chain is: **file change → fs.watch → WebSocket pub → browser reload**.

## Configuration

| Flag | Description | Default |
|------|-------------|---------|
| `--live-reload` | Enable live reload | Off |

When enabled, WebSocket notifications are automatically activated (no need for `--notifications`).

## What Triggers a Reload

| Source | Detected |
|--------|----------|
| Editor save (vim, VS Code, etc.) | Yes |
| `cp` or `mv` a file | Yes |
| HTTP PUT via curl or fetch | Yes |
| HTTP DELETE | Yes |
| Changes in subdirectories | Yes |

## Debouncing

Editors often trigger multiple save events. JSS debounces with a 100ms window to avoid duplicate reloads.

## Filtered Files

The watcher ignores:
- Hidden files (starting with `.`)
- Temp files ending in `~`
- Vim swap files ending in `.swp`

## Example Workflow

Terminal 1:
```bash
jss start --live-reload --public --root ~/mysite --port 3000
```

Terminal 2:
```bash
echo "<h1>Hello</h1>" > ~/mysite/index.html
# Browser at localhost:3000 refreshes automatically
```

## Technical Details

- Uses Node.js `fs.watch` with `{ recursive: true }`
- Constructs resource URLs from file paths relative to the data root
- Emits events through a shared `EventEmitter` (max 1000 listeners)
- WebSocket protocol: `sub <url>` / `pub <url>` (solid-0.1)
- The injected script subscribes to the current page URL on `/.notifications`
