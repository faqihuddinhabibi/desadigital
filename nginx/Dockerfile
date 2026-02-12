FROM nginx:alpine

# Install certbot for automatic SSL certificate management
RUN apk add --no-cache certbot

# Remove default config, replace with our custom proxy config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Create directories for certbot and SSL
RUN mkdir -p /var/www/certbot /etc/nginx/certs

# Verify config is valid at build time (fails build if config is broken)
RUN nginx -t

# Entrypoint: handles auto-SSL + starts nginx + periodic cert renewal
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
