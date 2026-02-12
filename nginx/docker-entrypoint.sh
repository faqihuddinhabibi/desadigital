#!/bin/sh
# Nginx entrypoint with automatic SSL via Let's Encrypt.
#
# Environment variables:
#   SSL_DOMAIN  — domain to get a certificate for (leave empty for HTTP-only)
#   SSL_EMAIL   — email for Let's Encrypt notifications
#
# When SSL_DOMAIN is set, the entrypoint will:
#   1. Check if certificates already exist (from previous run)
#   2. If not, start nginx temporarily and request a cert via certbot
#   3. Write the HTTPS nginx config
#   4. Start nginx in foreground with periodic cert renewal
#
# When SSL_DOMAIN is empty, nginx runs with the default HTTP-only config.

set -e

CERT_DIR="/etc/nginx/certs"
WEBROOT="/var/www/certbot"
CONF="/etc/nginx/conf.d/default.conf"

# ── Function: write SSL nginx config ──
write_ssl_config() {
  cat > "$CONF" << SSLEOF
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

resolver 127.0.0.11 valid=30s ipv6=off;
resolver_timeout 5s;

server {
    listen 80;
    server_name $SSL_DOMAIN;

    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name $SSL_DOMAIN;

    ssl_certificate $CERT_DIR/live/$SSL_DOMAIN/fullchain.pem;
    ssl_certificate_key $CERT_DIR/live/$SSL_DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    client_max_body_size 10m;

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
SSLEOF
  echo "[SSL] Nginx config written for HTTPS ($SSL_DOMAIN)"
}

# ── Main logic ──

if [ -n "$SSL_DOMAIN" ]; then
  CERT_PATH="$CERT_DIR/live/$SSL_DOMAIN/fullchain.pem"
  KEY_PATH="$CERT_DIR/live/$SSL_DOMAIN/privkey.pem"

  if [ -f "$CERT_PATH" ] && [ -f "$KEY_PATH" ]; then
    # Certificates already exist — just write the SSL config
    echo "[SSL] Certificates found for $SSL_DOMAIN, enabling HTTPS..."
    write_ssl_config
  else
    # No certs yet — request from Let's Encrypt
    echo "[SSL] No certificates for $SSL_DOMAIN. Requesting from Let's Encrypt..."

    # Start nginx as daemon (HTTP-only) so ACME challenge can be served
    nginx
    sleep 2

    if certbot certonly \
      --config-dir "$CERT_DIR" \
      --webroot -w "$WEBROOT" \
      --email "${SSL_EMAIL:-admin@example.com}" \
      --agree-tos \
      --no-eff-email \
      --non-interactive \
      -d "$SSL_DOMAIN"; then

      echo "[SSL] Certificate obtained! Switching to HTTPS..."
      write_ssl_config
    else
      echo "[SSL] Certificate request failed. Running HTTP-only for now."
      echo "[SSL] Ensure DNS A record for $SSL_DOMAIN points to this server."
      echo "[SSL] Will retry every 5 minutes in the background."
    fi

    # Stop the temporary daemon — will restart in foreground below
    nginx -s quit 2>/dev/null || true
    sleep 2
  fi

  # Background loop: retry cert if missing, renew if exists, reload nginx
  (while true; do
    if [ -f "$CERT_DIR/live/$SSL_DOMAIN/fullchain.pem" ]; then
      # Certs exist — renew (runs every 12h)
      sleep 12h
      certbot renew --config-dir "$CERT_DIR" --webroot -w "$WEBROOT" \
        --quiet --non-interactive 2>/dev/null || true
      nginx -s reload 2>/dev/null || true
    else
      # No certs yet — retry every 5 minutes
      sleep 300
      if certbot certonly \
        --config-dir "$CERT_DIR" \
        --webroot -w "$WEBROOT" \
        --email "${SSL_EMAIL:-admin@example.com}" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d "$SSL_DOMAIN" 2>/dev/null; then

        echo "[SSL] Certificate obtained on retry! Switching to HTTPS..."
        write_ssl_config
        nginx -s reload 2>/dev/null || true
      fi
    fi
  done) &

else
  # No SSL — periodic reload only (for manual setup-ssl.sh or config changes)
  (while true; do
    sleep 6h
    nginx -s reload 2>/dev/null
  done) &
fi

exec nginx -g "daemon off;"
