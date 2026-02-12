#!/bin/sh
# Periodically reload nginx every 6h so renewed SSL certs are picked up.
# This is the standard Docker pattern for certbot + nginx.

(while true; do
  sleep 6h
  nginx -s reload 2>/dev/null
done) &

exec nginx -g "daemon off;"
