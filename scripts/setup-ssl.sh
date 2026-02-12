#!/bin/bash
# Setup SSL for Desa Digital
# Usage: ./scripts/setup-ssl.sh <domain> <email>

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: ./scripts/setup-ssl.sh <domain> <email>"
  echo "Example: ./scripts/setup-ssl.sh desadigital.fibernode.id admin@fibernode.id"
  exit 1
fi

# ── Auto-detect Docker Compose project name from running containers ──
# Portainer sets the project name to the stack name (e.g. "desa-digital"),
# but running `docker compose` from the stack directory would default to
# the directory name (a numeric ID). We must use the correct project name
# so that volumes and networks match the running stack.
PROJECT_NAME=$(docker inspect desa-digital-proxy --format '{{ index .Config.Labels "com.docker.compose.project" }}' 2>/dev/null || true)

if [ -z "$PROJECT_NAME" ]; then
  echo "❌ Container desa-digital-proxy not found. Is the stack running?"
  echo "   Deploy the stack first via Portainer, then run this script."
  exit 1
fi

COMPOSE="docker compose -p $PROJECT_NAME -f docker-compose.prod.yml"

echo "🔒 Setting up SSL for $DOMAIN..."
echo "📦 Detected compose project: $PROJECT_NAME"
echo ""

# ── Step 1: Get certificate (uses existing HTTP config with acme-challenge) ──
echo "📜 Step 1/4: Requesting certificate from Let's Encrypt..."
$COMPOSE --profile ssl run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

echo "✅ Certificate obtained!"
echo ""

# ── Step 2: Write SSL nginx config (certs now exist) ──
echo "📝 Step 2/4: Updating Nginx config for HTTPS..."
cat > nginx/conf.d/default.conf << 'NGINXEOF'
# Properly handle WebSocket Connection header
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# Docker internal DNS resolver — re-resolves when containers restart
resolver 127.0.0.11 valid=30s ipv6=off;
resolver_timeout 5s;

server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/nginx/certs/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Allow file uploads up to 10MB (backend multer limit is 5MB)
    client_max_body_size 10m;

    # Upstream variables (forces DNS re-resolution per request)
    set $upstream_api http://desa-digital-api:4000;
    set $upstream_web http://desa-digital-web:3000;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api/ {
        proxy_pass $upstream_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass $upstream_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /health {
        proxy_pass $upstream_api;
    }

    location /streams/ {
        proxy_pass $upstream_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    location / {
        proxy_pass $upstream_web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

# Replace placeholder with actual domain
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/conf.d/default.conf 2>/dev/null || \
  sed -i '' "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/conf.d/default.conf

echo "✅ Nginx config updated!"
echo ""

# ── Step 3: Reload nginx (use container name — works regardless of project name) ──
echo "🔄 Step 3/4: Reloading Nginx with SSL config..."
docker exec desa-digital-proxy nginx -s reload

echo "✅ Nginx reloaded with SSL!"
echo ""

# ── Step 4: Start certbot auto-renewal service ──
echo "🔄 Step 4/4: Starting Certbot auto-renewal service..."
$COMPOSE --profile ssl up -d certbot

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ SSL setup complete for $DOMAIN"
echo "🌐 Your site is now available at https://$DOMAIN"
echo ""
echo "📝 Next steps:"
echo "   1. Di Portainer → Stacks → desa-digital → Environment variables"
echo "   2. Ubah CORS_ORIGIN=https://$DOMAIN"
echo "   3. Klik 'Update the stack'"
echo "════════════════════════════════════════════════════════"
