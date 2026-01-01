---
sidebar_position: 2
title: Deploy to Production
description: SSL, reverse proxy, and production setup
---

# Deploy to Production

Guide for deploying JSS in production.

## SSL/TLS

### Direct SSL

```bash
jss start --ssl-key ./key.pem --ssl-cert ./cert.pem --port 443
```

### With Let's Encrypt

Use certbot to obtain certificates, then point JSS at them:

```bash
jss start \
  --ssl-key /etc/letsencrypt/live/example.com/privkey.pem \
  --ssl-cert /etc/letsencrypt/live/example.com/fullchain.pem \
  --port 443
```

## Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Systemd Service

Create `/etc/systemd/system/jss.service`:

```ini
[Unit]
Description=JavaScript Solid Server
After=network.target

[Service]
Type=simple
User=jss
WorkingDirectory=/opt/jss
ExecStart=/usr/bin/jss start --config /etc/jss/config.json
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable jss
sudo systemctl start jss
```
