FROM nginx:alpine

# Copy nginx config into image (bind mounts don't work with Portainer Git deploy)
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Create directories for certbot and static files
RUN mkdir -p /var/www/certbot /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
