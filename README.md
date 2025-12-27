# Application Directory

A Keycloak-authenticated application directory for managing and accessing self-hosted applications. Similar to Okta, it provides users with a centralized view of all applications they have access to, based on their Keycloak group memberships.

## Features

- **Keycloak SSO Authentication**: Secure OIDC authentication with confidential client
- **Flexible Access Control**:
  - Apps without groups are public (visible to all authenticated users)
  - Apps with groups require membership for access
  - Admin override: Administrators see all apps in their categories
- **Category Organization**: Hierarchical YAML structure with Font Awesome icons
- **Automatic Token Refresh**: Server-side session management with automatic token refresh
- **Responsive UI**: Modern, mobile-friendly interface with Tailwind CSS
- **Search Functionality**: Filter applications by name or description
- **Easy Configuration**: Hierarchical YAML with sensible defaults

## Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + Tailwind CSS
- **Authentication**: Keycloak OIDC (Authorization Code Flow with PKCE)
- **Session Store**: Redis (production) or in-memory (development)
- **Configuration**: YAML-based app and group mappings
- **Deployment**: Single Docker container with Nginx + Node.js

## Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose (for containerized deployment)
- Keycloak server (existing instance)
- Redis (optional, for production sessions)
- [just](https://github.com/casey/just) (optional, for easy local development)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/LinuxRocker/application-directory.git
cd application-directory

# Copy example configuration files
cp docker-compose.yml.example docker-compose.yml
cp backend/.env.example backend/.env
cp config/apps.yaml.example config/apps.yaml

# Install dependencies
npm install

# Or use just for setup
just install
```

### 2. Configure Keycloak

#### Create a Realm

1. Log into your Keycloak admin console
2. Create a new realm called `dashboard` (or use an existing realm)
3. Note the realm URL: `https://your-keycloak.com/realms/dashboard`

#### Create a Confidential Client

1. Go to **Clients** → **Create client**
2. Configure the client:
   - **Client ID**: `application-directory`
   - **Client type**: OpenID Connect
   - **Client authentication**: ON (confidential)
3. In the **Settings** tab:
   - **Valid redirect URIs**:
     - Development: `http://localhost:3000/api/auth/callback`
     - Production: `https://your-dashboard-domain.com/api/auth/callback`
   - **Valid post logout redirect URIs**: `https://your-dashboard-domain.com/`
   - **Web origins**:
     - Development: `http://localhost:5173`
     - Production: `https://your-dashboard-domain.com`
4. Go to the **Credentials** tab and copy the **Client secret**

#### Configure Group Mapper

1. Go to your client → **Client scopes** → `application-directory-dedicated`
2. Click **Add mapper** → **By configuration** → **Group Membership**
3. Configure:
   - **Name**: `groups`
   - **Token Claim Name**: `groups`
   - **Full group path**: OFF
   - **Add to ID token**: ON
   - **Add to access token**: ON
   - **Add to userinfo**: ON

#### Create Groups

1. Go to **Groups** → **Create group**
2. Create groups for your applications, for example:
   - `media-users` - Regular media app users
   - `media-admins` - Media administrators (see all media apps)
   - `infrastructure-users` - Infrastructure app users
   - `infrastructure-admins` - Infrastructure administrators
   - `all-users` - All authenticated users

#### Assign Users to Groups

1. Go to **Users** → Select a user
2. Go to the **Groups** tab
3. Click **Join Group** and assign appropriate groups

### 3. Configure Environment Variables

Edit the environment section in `docker-compose.yml` with your Keycloak settings:

```yaml
environment:
  # Keycloak OIDC Configuration
  - KEYCLOAK_ISSUER=https://your-keycloak.com/realms/dashboard
  - KEYCLOAK_CLIENT_ID=application-directory
  - KEYCLOAK_CLIENT_SECRET=your-client-secret-from-keycloak
  - KEYCLOAK_REDIRECT_URI=http://localhost:3000/api/auth/callback

  # Session Configuration
  - SESSION_SECRET=generate-a-strong-random-secret-min-32-chars

  # ... other settings
```

### 4. Configure Applications

Edit `config/apps.yaml` with a hierarchical structure:

```yaml
# Hierarchical category-based application structure
# If groups/adminGroups are not specified, app is accessible to all authenticated users

categories:
  media:
    name: "Media"
    icon: "fa-film"  # Font Awesome icon
    order: 1
    description: "Streaming and media management"
    apps:
      - id: "plex"
        name: "Plex"
        description: "Media streaming server"
        url: "https://plex.example.com"
        icon: "fa-play-circle"
        groups:
          - "media-users"      # Only these users see it
        adminGroups:
          - "media-admins"     # Admins see all Media apps

  infrastructure:
    name: "Infrastructure"
    icon: "fa-server"
    order: 2
    description: "Server management"
    apps:
      - id: "portainer"
        name: "Portainer"
        description: "Docker management"
        url: "https://portainer.example.com"
        icon: "fa-docker"
        groups:
          - "infrastructure-users"
        adminGroups:
          - "infrastructure-admins"

  resources:
    name: "Resources"
    icon: "fa-book"
    order: 3
    apps:
      - id: "docs"
        name: "Documentation"
        description: "Internal docs"
        url: "https://docs.example.com"
        icon: "fa-book-open"
        # No groups = public to all authenticated users
```

**Key Points:**
- Apps are nested under their category
- Use Font Awesome 6 icon classes (e.g., `fa-film`, `fa-server`)
- Omit `groups` to make an app public to all authenticated users
- Only specify `groups` when you want to restrict access

### 5. Run Development Environment

```bash
# Using just (recommended)
just dev

# Or using npm
npm run dev

# Or start them separately:
just dev-backend
just dev-frontend
```

The Justfile provides many useful commands:
```bash
just --list          # List all available commands
just setup           # First-time setup (install deps + start Redis)
just install         # Install all dependencies
just dev             # Start both backend and frontend
just build           # Build for production
just validate-config # Check apps.yaml syntax
just check           # Run all checks
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

## Production Deployment

### Docker Build

```bash
# Build the Docker image
docker build -t application-directory:latest .

# Run the container
docker run -d \
  --name application-directory \
  -p 80:80 \
  -v $(pwd)/config:/app/config \
  -e KEYCLOAK_ISSUER=https://your-keycloak.com/realms/dashboard \
  -e KEYCLOAK_CLIENT_ID=application-directory \
  -e KEYCLOAK_CLIENT_SECRET=your-secret \
  -e KEYCLOAK_REDIRECT_URI=https://dashboard.example.com/api/auth/callback \
  -e SESSION_SECRET=your-strong-secret \
  -e SESSION_SECURE=true \
  -e CORS_ORIGIN=https://dashboard.example.com \
  -e USE_REDIS_SESSIONS=true \
  -e REDIS_URL=redis://your-redis:6379 \
  application-directory:latest
```

### With Docker Compose (Production)

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  dashboard:
    image: application-directory:latest
    ports:
      - "80:80"
    volumes:
      - ./config:/app/config
    env_file:
      - .env.production
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Configuration Guide

### Access Control Behavior

**Public Apps (No Groups Specified)**
```yaml
- id: "docs"
  name: "Documentation"
  url: "https://docs.example.com"
  icon: "fa-book"
  # No groups = visible to ALL authenticated users
```

**Restricted Apps (Groups Specified)**
```yaml
- id: "sonarr"
  name: "Sonarr"
  url: "https://sonarr.example.com"
  icon: "fa-satellite-dish"
  groups: ["media-power-users"]  # Only these users see it
```

**Admin Override**

Define `adminGroups` to give users access to ALL apps in a category:

```yaml
categories:
  media:
    apps:
      - id: "plex"
        groups: ["media-users"]
        adminGroups: ["media-admins"]  # Admins see ALL Media apps

      - id: "sonarr"
        groups: ["media-power-users"]
        adminGroups: ["media-admins"]  # Same admin group = sees everything
```

If a user is in `media-admins`, they see Plex, Sonarr, and ALL other apps in the Media category, regardless of individual `groups` settings.

### Category Visibility

- Categories are only shown if the user has access to at least one app
- Empty categories are automatically hidden
- Public links count as accessible apps

### Icons

Use Font Awesome 6 Free icon classes:
- Format: `icon: "fa-icon-name"`
- Examples: `fa-film`, `fa-server`, `fa-docker`, `fa-github`
- Browse icons: https://fontawesome.com/icons
- Only solid icons (`fa-solid`) are supported by default

## Troubleshooting

### Authentication Issues

**Problem**: Redirect loop or "Not authenticated" errors

**Solutions**:
- Verify `KEYCLOAK_REDIRECT_URI` matches exactly what's configured in Keycloak
- Check that `CORS_ORIGIN` is correct
- Ensure cookies are enabled in your browser
- For HTTPS: set `SESSION_SECURE=true` and `SESSION_SAME_SITE=none` or `lax`

### Groups Not Showing

**Problem**: User is in groups but dashboard shows no apps

**Solutions**:
- Verify group mapper is configured correctly in Keycloak
- Check that `Token Claim Name` is exactly `groups`
- Test by checking `/api/user/profile` endpoint (requires authentication)
- Verify group names match exactly between Keycloak and `apps.yaml`

### Config File Not Loading

**Problem**: Changes to `apps.yaml` not reflected

**Solutions**:
- Check file syntax with a YAML validator
- Look at backend logs for validation errors
- Verify `CONFIG_PATH` points to correct file
- Restart backend if `CONFIG_WATCH` is disabled

## API Endpoints

### Authentication
- `GET /api/auth/login` - Redirect to Keycloak login
- `GET /api/auth/callback` - OIDC callback handler
- `POST /api/auth/logout` - End session
- `GET /api/auth/status` - Check auth status

### User
- `GET /api/user/profile` - Get user profile and groups
- `GET /api/user/groups` - Get user's groups

### Applications
- `GET /api/apps` - Get filtered apps by category
- `GET /api/apps/categories` - Get all categories
- `GET /api/apps/search?q=query` - Search apps

## Security Considerations

- **Confidential Client**: Always use client secret, never expose it
- **HTTP-Only Cookies**: Tokens are never accessible to JavaScript
- **CSRF Protection**: SameSite cookies prevent CSRF attacks
- **Token Refresh**: Automatic refresh keeps sessions alive securely
- **Rate Limiting**: Auth endpoints are rate-limited
- **Helmet**: Security headers configured by default

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or pull request.
