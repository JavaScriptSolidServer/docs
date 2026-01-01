---
sidebar_position: 7
title: WebSocket Notifications
description: Real-time updates via solid-0.1 protocol
---

# WebSocket Notifications

JSS supports real-time notifications for resource changes.

## Enable notifications

```bash
jss start --notifications
```

## Discover WebSocket URL

Check the `Updates-Via` header:

```bash
curl -I http://localhost:3000/alice/public/
# Updates-Via: ws://localhost:3000/.notifications
```

## Protocol (solid-0.1)

Compatible with SolidOS:

```
Server: protocol solid-0.1
Client: sub http://localhost:3000/alice/public/data.json
Server: ack http://localhost:3000/alice/public/data.json
Server: pub http://localhost:3000/alice/public/data.json  (on change)
```

## JavaScript Example

```javascript
const ws = new WebSocket('ws://localhost:3000/.notifications');

ws.onopen = () => {
  ws.send('sub http://localhost:3000/alice/public/data.json');
};

ws.onmessage = (event) => {
  if (event.data.startsWith('pub ')) {
    const url = event.data.slice(4);
    console.log('Resource changed:', url);
    // Refetch the resource
  }
};
```
