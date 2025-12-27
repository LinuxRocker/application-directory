# Justfile for Application Directory
# Install just: https://github.com/casey/just

# List all available commands
default:
    @just --list

# Install all dependencies
install:
    @echo "Installing root dependencies..."
    npm install
    @echo "Installing backend dependencies..."
    cd backend && npm install
    @echo "Installing frontend dependencies..."
    cd frontend && npm install

# Run both backend and frontend in development mode
dev:
    @echo "Starting development servers..."
    npm run dev

# Run only the backend
dev-backend:
    @echo "Starting backend..."
    cd backend && npm run dev

# Run only the frontend
dev-frontend:
    @echo "Starting frontend..."
    cd frontend && npm run dev

# Build both backend and frontend
build:
    @echo "Building backend..."
    cd backend && npm run build
    @echo "Building frontend..."
    cd frontend && npm run build

# Build only the backend
build-backend:
    cd backend && npm run build

# Build only the frontend
build-frontend:
    cd frontend && npm run build

# Lint both backend and frontend
lint:
    @echo "Linting backend..."
    cd backend && npm run lint
    @echo "Linting frontend..."
    cd frontend && npm run lint

# Run backend tests
test-backend:
    cd backend && npm test

# Start Redis container for local development
redis-start:
    docker run -d --name homelab-redis -p 6379:6379 redis:7-alpine

# Stop Redis container
redis-stop:
    docker stop homelab-redis && docker rm homelab-redis

# Clean all build artifacts and node_modules
clean:
    @echo "Cleaning build artifacts..."
    rm -rf backend/dist
    rm -rf frontend/dist
    @echo "Cleaning node_modules..."
    rm -rf node_modules
    rm -rf backend/node_modules
    rm -rf frontend/node_modules

# Build Docker image
docker-build:
    docker build -t application-directory:latest .

# Run Docker container
docker-run:
    docker run -d --name application-directory \
        -p 80:80 \
        -v $(pwd)/config:/app/config \
        application-directory:latest

# Stop Docker container
docker-stop:
    docker stop application-directory && docker rm application-directory

# View backend logs (when running via npm)
logs-backend:
    tail -f backend/logs/*.log

# Validate apps.yaml configuration
validate-config:
    @echo "Validating config/apps.yaml..."
    @node -e "const yaml = require('yaml'); const fs = require('fs'); try { yaml.parse(fs.readFileSync('./config/apps.yaml', 'utf8')); console.log('✓ Configuration is valid YAML'); } catch(e) { console.error('✗ Invalid YAML:', e.message); process.exit(1); }"

# Check for common issues
check: validate-config
    @echo "Checking for node_modules..."
    @test -d backend/node_modules || echo "⚠ Backend node_modules missing. Run: just install"
    @test -d frontend/node_modules || echo "⚠ Frontend node_modules missing. Run: just install"
    @echo "Checking environment configuration..."
    @test -f .env && echo "⚠ Found .env file (not needed with docker-compose)" || echo "✓ No .env file (using docker-compose env vars)"

# Quick setup for first-time users
setup: install redis-start
    @echo ""
    @echo "✓ Setup complete!"
    @echo ""
    @echo "Next steps:"
    @echo "1. Update Keycloak settings in docker-compose.yml"
    @echo "2. Edit config/apps.yaml with your applications"
    @echo "3. Run 'just dev' to start development servers"
    @echo ""
    @echo "Backend will be at: http://localhost:3000"
    @echo "Frontend will be at: http://localhost:5173"
