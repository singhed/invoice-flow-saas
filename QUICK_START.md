# Quick Start

Get running in 5 minutes.

## Requirements

- Node.js 20+, pnpm 8+, Docker

## Setup

**Install**

```bash
pnpm install
```

**Infrastructure**

```bash
docker-compose up -d
```

**Configure**

```bash
cp .env.example .env
```

**Migrate**

```bash
pnpm --filter @invoice-saas/invoice-service prisma:migrate:deploy
pnpm --filter @invoice-saas/invoice-service prisma:generate
```

**Start**

```bash
pnpm dev
```

## Access

- Frontend: `http://localhost:3000`
- API: `http://localhost:3000/api`
- Docs: `http://localhost:3000/api-docs`

## Commands

**Development**

```bash
pnpm dev                   # Start all services
pnpm run lint             # Lint
pnpm run typecheck        # Type check
pnpm run format           # Format
```

**Database**

```bash
pnpm --filter @invoice-saas/invoice-service prisma:migrate:dev
pnpm --filter @invoice-saas/invoice-service prisma:studio
```

**Testing**

```bash
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
```

**Production**

```bash
pnpm run docker:build
kubectl apply -k infrastructure/kubernetes/overlays/prod
```

## Stack

- Microservices (API Gateway, Invoice, User, Payment)
- React with TypeScript
- PostgreSQL with Prisma
- Redis caching
- JWT authentication

## Test

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}'

# Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}' \
  | jq -r '.token')

# Create invoice
curl -X POST http://localhost:3000/api/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Client",
    "amount": 100.00,
    "currency": "USD",
    "dueDate": "2024-12-31"
  }'
```

## Troubleshooting

**Port in use**

```bash
lsof -ti:3000 | xargs kill -9
```

**Database error**

```bash
docker ps
docker-compose restart postgres
```

**Missing modules**

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Resources

- [README.md](README.md) Documentation
- [INSTALLATION.md](INSTALLATION.md) Detailed setup
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) API reference
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) Architecture
