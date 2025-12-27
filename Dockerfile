# Stage 1: Install dependencies
FROM node:24-alpine AS deps

WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies (workspaces)
RUN npm ci

# Stage 2: Build frontend
FROM node:24-alpine AS frontend-build

WORKDIR /app

# Copy root node_modules (npm workspaces hoists dependencies)
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace packages and frontend source
COPY --from=deps /app/package*.json ./
COPY frontend/ ./frontend/

# Build frontend
RUN npm run build:frontend

# Stage 3: Build backend
FROM node:24-alpine AS backend-build

WORKDIR /app

# Copy root node_modules (npm workspaces hoists dependencies)
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace packages and backend source
COPY --from=deps /app/package*.json ./
COPY backend/ ./backend/

# Build backend
RUN npm run build:backend

# Stage 4: Production - Install only production dependencies
FROM node:24-alpine AS prod-deps

WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install only production dependencies
RUN npm ci --omit=dev

# Stage 5: Final production image
FROM node:24-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache nginx supervisor

# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/package.json ./backend/

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy application config example
COPY config/apps.yaml.example ./config/apps.yaml.example

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
environment=NODE_ENV=production,NODE_PATH=/app/node_modules
EOF

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
