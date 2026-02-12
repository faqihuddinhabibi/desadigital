#!/bin/bash
# Setup SSL for Desa Digital
# Usage: ./scripts/setup-ssl.sh <domain> <email>

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: ./scripts/setup-ssl.sh <domain> <email>"
  echo "Example: ./scripts/setup-ssl.sh desadigital.fibernode.id admin@fibernode.id"
  exit 1
fi

echo "🔒 Setting up SSL for $DOMAIN..."

# Create SSL nginx config
cat > nginx/conf.d/default.conf << EOF
# Properly handle WebSocket Connection header
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

# Docker internal DNS resolver — re-resolves when containers restart
resolver 127.0.0.11 valid=30s ipv6=off;
resolver_timeout 5s;

server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/nginx/certs/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Allow file uploads up to 10MB (backend multer limit is 5MB)
    client_max_body_size 10m;

    # Upstream variables (forces DNS re-resolution per request)
    set \$upstream_api http://desa-digital-api:4000;
    set \$upstream_web http://desa-digital-web:3000;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api/ {
        proxy_pass \$upstream_api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws/ {
        proxy_pass \$upstream_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /health {
        proxy_pass \$upstream_api;
    }

    location /streams/ {
        proxy_pass \$upstream_api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
    }

    location / {
        proxy_pass \$upstream_web;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "📝 Nginx config updated for $DOMAIN"

# Get initial certificate
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN

# Reload nginx to apply SSL config
docker compose -f docker-compose.prod.yml exec nginx-proxy nginx -s reload

# Start certbot renewal service (auto-renew every 12 hours)
echo "🔄 Starting Certbot auto-renewal service..."
docker compose -f docker-compose.prod.yml --profile ssl up -d certbot

echo "✅ SSL setup complete for $DOMAIN"
echo "🌐 Your site is now available at https://$DOMAIN"
echo ""
echo "📝 Next steps:"
echo "   1. Update CORS_ORIGIN to https://$DOMAIN in Portainer environment variables"
echo "   2. Click 'Update the stack' in Portainer"
