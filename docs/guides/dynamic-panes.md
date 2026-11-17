---
sidebar_position: 8
title: Dynamic Panes
description: Add your own SolidOS panes to the data browser without rebuilding mashlib
---

# Dynamic Panes

A **pane** is a view in the [SolidOS](https://github.com/SolidOS/solidos) data browser: the folder view, the profile view, the chat view. Normally panes are compiled into mashlib, so adding one means a new mashlib build.

From JSS 0.0.227 the server can be given a list of pane modules. The data browser page loads and registers them before SolidOS starts, so they are offered like any built-in pane. Mashlib is not changed or rebuilt.

## Try it

```bash
jss start --mashlib-cdn --conneg \
  --panes https://melvincarvalho.github.io/pane-loader/examples/meetings-pane.js
```

Open a folder that holds three or more dated files (`2026_11_04.md`, `2026-11-11.md`, ...) and the pane menu offers **Calendar** beside the built-in panes:

![The SolidOS pane menu on a folder of meeting notes, with Calendar listed beside Contents, Source, Under The Hood and Manage Access](/img/dynamic-panes/pane-menu.png)

Choose it and the folder becomes a year view, month by month, each day opening that document:

![The Calendar pane: the year 2026 with 41 meeting notes shown as days under each month](/img/dynamic-panes/calendar-pane.png)

Neither the menu entry nor the view is in mashlib. Both come from the one module named on the command line.

## Write a pane

A pane is an ES module whose default export is an object with a `name`, a `label` function and a `render` function. It imports nothing: everything it needs arrives in the `context`.

```js title="hello-pane.js"
const LDP_CONTAINS = 'http://www.w3.org/ns/ldp#contains'

export default {
  name: 'hello-dynamic',

  // "Can I show this?" A string means yes, null means no. Keep it cheap.
  label (subject, context) {
    return subject.uri.endsWith('/') ? 'Hello' : null
  },

  // Build the view and return one element.
  render (subject, context) {
    const store = context.session.store
    const count = new Set(
      store.each(subject, store.sym(LDP_CONTAINS)).map(n => n.value)
    ).size
    const div = context.dom.createElement('div')
    div.textContent = 'This folder lists ' + count + ' things.'
    return div
  }
}
```

Put the file anywhere the browser can fetch it as JavaScript, including your own pod, then name it in the list:

```bash
jss start --mashlib-cdn --conneg --panes /public/panes/hello-pane.js
```

Working examples: [hello-pane.js](https://github.com/melvincarvalho/pane-loader/blob/gh-pages/examples/hello-pane.js) and [meetings-pane.js](https://github.com/melvincarvalho/pane-loader/blob/gh-pages/examples/meetings-pane.js).

## The list

| Set it with | Form |
| --- | --- |
| `--panes <urls>` | comma-separated |
| `JSS_PANES` | comma-separated |
| `panes` in the config file | an array of strings |

- Each entry is an `http(s)` URL or an absolute path on this server (`/public/panes/my-pane.js`). Anything else is dropped, and the server says which entries it dropped at start-up.
- A URL that itself contains a comma has to go in the config file.
- It applies to `--mashlib-cdn` and, from JSS 0.0.230, to `--mashlib-module`. A module entry point (for example the no-build SolidOS, [solidos-nobuild](https://github.com/JavaScriptSolidServer/solidos-nobuild)) starts SolidOS itself, so there the panes are added as soon as it has put the pane registry on the page, and the view on show is redrawn so that they are offered.
- With no list, the page is exactly what it was before.

## What happens at start-up

1. The page fetches all the listed modules at the same time.
2. Each one that is a pane is registered, in the order listed, after the built-in panes. It is offered alongside them and does not replace the default view.
3. SolidOS starts when every pane is handled, or after 5 seconds, whichever is first.

A pane that fails to load, or is not a pane, is skipped with a console warning and the data browser still starts. A pane slower than 5 seconds is registered when it arrives and is offered from the next view drawn.

Look for lines starting `[jss] pane` in the browser console to see what was loaded.

## Trust

A pane runs in the page with the logged-in session and can do whatever the person can. The list is set by whoever runs the server, so add only panes you would install for every user.

Panes chosen by each user, signed panes and trust ratings are the next steps, tracked in [JSS #651](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer/issues/651).

## Background

- [SolidOS Panes, section 7: Loading panes dynamically](https://melvincarvalho.github.io/solidos-panes/#dynamic), the paper this follows
- [pane-loader](https://github.com/melvincarvalho/pane-loader), the loader JSS ships, with a [live demo](https://melvincarvalho.github.io/pane-loader/demo.html)
- [Mashlib UI](/features/mashlib-ui), the data browser itself
