# Application Directory

A Keycloak-authenticated application directory for managing and accessing self-hosted applications. Provides users with a centralized dashboard of all applications they have access to, based on their Keycloak group memberships.

## Features

- **Keycloak SSO**: OIDC authentication with automatic token refresh
- **Group-Based Access Control**: Apps visible based on user group membership
- **Category-Level Admin Override**: Admins see all apps in their categories
- **Search & Filter**: Quickly find applications
- **Responsive UI**: Modern interface with Tailwind CSS and Font Awesome icons
- **Redis Sessions**: Persistent session storage for production
- **Easy Configuration**: Simple YAML-based app definitions

## Quick Start

### 1. Deploy with Docker

```bash
# Create docker-compose.yml
services:
  app-directory:
    image: ghcr.io/linuxrocker/application-directory:latest
    ports:
      - "80:80"
    volumes:
      - ./config:/app/config
    environment:
      - KEYCLOAK_ISSUER=https://keycloak.example.com/realms/your-realm
      - KEYCLOAK_CLIENT_ID=application-directory
      - KEYCLOAK_CLIENT_SECRET=your-secret
      - KEYCLOAK_REDIRECT_URI=https://apps.example.com/api/auth/callback
      - SESSION_SECRET=generate-strong-random-secret-min-32-chars
      - SESSION_SECURE=true
      - CORS_ORIGIN=https://apps.example.com
      - USE_REDIS_SESSIONS=true
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### 2. Configure Keycloak

1. **Create a confidential OIDC client** with redirect URI: `https://apps.example.com/api/auth/callback`
2. **Add group mapper** to include `groups` claim in tokens (Token Claim Name: `groups`)
3. **Create groups** for your apps (e.g., `media-users`, `monitoring-admins`)
4. **Assign users to groups**

### 3. Configure Applications

Create `config/apps.yaml`:

```yaml
categories:
  monitoring:
    name: "Monitoring"
    icon: "fa-chart-line"
    order: 1
    adminGroups:
      - "monitoring-admins"  # See all monitoring apps
    apps:
      - id: "grafana"
        name: "Grafana"
        description: "Metrics and dashboards"
        url: "https://grafana.example.com"
        icon: "fa-chart-bar"
        groups: ["monitoring-viewers"]  # Restrict to specific users

      - id: "prometheus"
        name: "Prometheus"
        url: "https://prometheus.example.com"
        icon: "fa-database"
        # No groups = visible to all authenticated users
```

**Access Control:**
- **No groups** = visible to all authenticated users
- **With groups** = visible only to users in specified groups
- **adminGroups** (at category level) = users see ALL apps in that category

## Configuration

### Environment Variables

**Required:**
- `KEYCLOAK_ISSUER` - Keycloak realm URL
- `KEYCLOAK_CLIENT_ID` - OIDC client ID
- `KEYCLOAK_CLIENT_SECRET` - OIDC client secret
- `KEYCLOAK_REDIRECT_URI` - Callback URL
- `SESSION_SECRET` - Random secret (32+ chars)
- `CORS_ORIGIN` - Frontend URL

**Session (Production):**
- `USE_REDIS_SESSIONS=true`
- `REDIS_URL=redis://host:6379`
- `SESSION_SECURE=true`
- `SESSION_SAME_SITE=lax`

**Optional:**
- `CONFIG_PATH=/app/config/apps.yaml`
- `CONFIG_WATCH=true` - Auto-reload config
- `LOG_LEVEL=info`

### Icons

Use Font Awesome 6 Free solid icons: `fa-icon-name`

Browse icons at: https://fontawesome.com/icons

## Development

```bash
# Install dependencies
npm install

# Copy example configs
cp backend/.env.example backend/.env
cp config/apps.yaml.example config/apps.yaml

# Start development (requires Redis running)
npm run dev

# Or use justfile
just setup  # First-time setup
just dev    # Start dev servers
```

## Deployment

**Available image tags:**
- `ghcr.io/linuxrocker/application-directory:latest` - Latest release
- `ghcr.io/linuxrocker/application-directory:master` - Latest commit
- `ghcr.io/linuxrocker/application-directory:v1.0.0` - Specific version

**GitHub Actions automatically builds and publishes images:**
- Push to `master` → `master` tag
- GitHub release → version tags + `latest`

## Troubleshooting

**OAuth state mismatch errors:**
- Ensure Redis is running and `USE_REDIS_SESSIONS=true`
- Check that `SESSION_SECURE=true` for HTTPS deployments

**Groups not showing:**
- Verify Keycloak group mapper Token Claim Name is `groups`
- Check group names match exactly in Keycloak and `apps.yaml`
- Test with: `curl https://apps.example.com/api/user/profile` (requires auth)

**Config not loading:**
- Validate YAML syntax
- Check backend logs for errors
- Set `CONFIG_WATCH=true` for auto-reload

## API Endpoints

- `GET /api/auth/login` - Start login flow
- `GET /api/auth/callback` - OIDC callback
- `POST /api/auth/logout` - End session
- `GET /api/apps` - Get user's apps
- `GET /api/apps/search?q=term` - Search apps
- `GET /api/user/profile` - User info & groups

## License

MIT
