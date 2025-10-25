# Quick Start Guide

Get the Invoice SaaS application running in 5 minutes.

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration if needed
```

### 4. Run Migrations

```bash
pnpm --filter @invoice-saas/invoice-service prisma:migrate:deploy
pnpm --filter @invoice-saas/invoice-service prisma:generate
```

### 5. Start Services

```bash
pnpm dev
```

## Access the Application

- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- API Docs: http://localhost:3000/api-docs

## Essential Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm run lint              # Lint code
pnpm run typecheck         # Type checking
pnpm run format            # Format code

# Database
pnpm --filter @invoice-saas/invoice-service prisma:migrate:dev   # Create migration
pnpm --filter @invoice-saas/invoice-service prisma:studio        # Open database GUI

# Testing
pnpm run test:unit         # Unit tests
pnpm run test:integration  # Integration tests
pnpm run test:e2e          # E2E tests

# Production
pnpm run docker:build      # Build Docker images
kubectl apply -k infrastructure/kubernetes/overlays/prod  # Deploy to K8s
```

## What's Included

After setup you have:
- Microservices architecture (API Gateway, Invoice, User, Payment services)
- React frontend with TypeScript
- PostgreSQL database with Prisma ORM
- Redis caching layer
- Authentication with JWT
- API documentation
- Automated tests

## Quick Test

Create a test user and invoice:

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}'

# Login and get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}' \
  | jq -r '.token')

# Create invoice
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "clientName": "Test Client",
    "clientEmail": "client@example.com",
    "amount": 100.00,
    "currency": "USD",
    "dueDate": "2024-12-31"
  }'
```

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error

```bash
# Check Docker containers
docker ps

# Restart PostgreSQL
docker-compose restart postgres
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [INSTALLATION.md](INSTALLATION.md) for detailed setup
- See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API reference
- Review [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
