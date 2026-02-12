FROM nginx:alpine

# Remove default config, replace with our custom proxy config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Create directories for certbot and SSL
RUN mkdir -p /var/www/certbot /etc/nginx/certs

# Verify config is valid at build time (fails build if config is broken)
RUN nginx -t

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
