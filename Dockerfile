# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine

WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx supervisor

# Copy backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/

# Copy frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy application config
COPY config ./config

# Create supervisor config
RUN mkdir -p /var/log/supervisor

COPY <<EOF /etc/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log

[program:nginx]
command=/usr/sbin/nginx -g 'daemon off;'
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:backend]
command=node /app/backend/dist/server.js
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
directory=/app/backend
environment=NODE_ENV=production
EOF

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
