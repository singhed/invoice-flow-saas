# Installation Guide

## Prerequisites

- Node.js 20+ and pnpm 8+
- Docker 24+
- PostgreSQL 15+ (or use Docker)
- AWS CLI v2 (for production)
- Terraform 1.5+ (for infrastructure)
- kubectl 1.28+ (for Kubernetes)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/invoice-saas.git
cd invoice-saas
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `REFRESH_TOKEN_SECRET` - Secret for refresh tokens
- `OPENAI_API_KEY` - For AI features (optional)

### 4. Start Infrastructure Services

Using Docker Compose:

```bash
docker-compose up -d postgres redis localstack
```

### 5. Run Database Migrations

```bash
pnpm --filter @invoice-saas/invoice-service prisma:migrate:deploy
pnpm --filter @invoice-saas/invoice-service prisma:generate
```

### 6. Start Development Servers

```bash
# Start all services
pnpm dev
```

Services will be available at:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:3000/api
- API Documentation: http://localhost:3000/api-docs

## Manual Setup

### Backend Services

Start each service individually:

```bash
# API Gateway
pnpm --filter @invoice-saas/api-gateway dev

# Invoice Service
pnpm --filter @invoice-saas/invoice-service dev

# User Service
pnpm --filter @invoice-saas/user-service dev

# Payment Service
pnpm --filter @invoice-saas/payment-service dev
```

### Frontend

```bash
cd apps/web
pnpm dev
```

## Production Deployment

### 1. Deploy Infrastructure

```bash
cd infrastructure/terraform
terraform init
terraform plan -var-file="environments/prod/terraform.tfvars"
terraform apply
```

### 2. Build and Push Docker Images

```bash
pnpm run docker:build
pnpm run docker:push
```

### 3. Deploy to Kubernetes

```bash
kubectl apply -k infrastructure/kubernetes/overlays/prod
```

### 4. Verify Deployment

```bash
kubectl get pods -n invoice-saas
kubectl get svc -n invoice-saas
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql $DATABASE_URL

# Check logs
docker logs postgres
```

### Port Conflicts

```bash
# Find process using port
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001 pnpm dev
```

### Migration Failures

```bash
# Check migration status
pnpm --filter @invoice-saas/invoice-service prisma:migrate:status

# Reset database (WARNING: deletes all data)
pnpm --filter @invoice-saas/invoice-service prisma:migrate:reset

# Regenerate Prisma client
pnpm --filter @invoice-saas/invoice-service prisma:generate
```

### Missing Dependencies

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear cache
pnpm store prune
```

## Verification

### Test Backend Health

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

### Run Tests

```bash
# All tests
pnpm run test:all

# Specific suites
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
```

### Access API Documentation

Open http://localhost:3000/api-docs in your browser.

## Next Steps

1. Review [README.md](README.md) for project overview
2. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API details
3. See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for production setup
4. Explore [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
