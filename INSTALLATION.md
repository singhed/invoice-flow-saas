# Installation

## Requirements

- Node.js 20+, pnpm 8+, Docker 24+
- PostgreSQL 15+ (or Docker)
- AWS CLI v2, Terraform 1.5+, kubectl 1.28+ (production)

## Local Setup

**Clone Repository**

```bash
git clone https://github.com/your-org/invoice-saas.git
cd invoice-saas
```

**Install Dependencies**

```bash
pnpm install
```

**Configure Environment**

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` PostgreSQL connection
- `JWT_SECRET` Token signing key
- `REFRESH_TOKEN_SECRET` Refresh token key
- `OPENAI_API_KEY` AI features (optional)

**Start Infrastructure**

```bash
docker-compose up -d postgres redis localstack
```

**Run Migrations**

```bash
pnpm --filter @invoice-saas/invoice-service prisma:migrate:deploy
pnpm --filter @invoice-saas/invoice-service prisma:generate
```

**Start Services**

```bash
pnpm dev
```

Access at:
- Frontend: `http://localhost:3000`
- API: `http://localhost:3000/api`
- Docs: `http://localhost:3000/api-docs`

## Individual Services

Start services separately:

```bash
pnpm --filter @invoice-saas/api-gateway dev
pnpm --filter @invoice-saas/invoice-service dev
pnpm --filter @invoice-saas/user-service dev
pnpm --filter @invoice-saas/payment-service dev
```

## Production

**Deploy Infrastructure**

```bash
cd infrastructure/terraform
terraform init
terraform plan -var-file="environments/prod/terraform.tfvars"
terraform apply
```

**Build and Deploy**

```bash
pnpm run docker:build
pnpm run docker:push
kubectl apply -k infrastructure/kubernetes/overlays/prod
```

**Verify**

```bash
kubectl get pods -n invoice-saas
kubectl get svc -n invoice-saas
```

## Troubleshooting

**Database Connection**

```bash
docker ps | grep postgres
psql $DATABASE_URL
docker logs postgres
```

**Port Conflicts**

```bash
lsof -ti:3000 | xargs kill -9
PORT=3001 pnpm dev
```

**Migration Issues**

```bash
pnpm --filter @invoice-saas/invoice-service prisma:migrate:status
pnpm --filter @invoice-saas/invoice-service prisma:migrate:reset
pnpm --filter @invoice-saas/invoice-service prisma:generate
```

**Dependencies**

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm store prune
```

## Verification

**Health Checks**

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

**Tests**

```bash
pnpm run test:all
pnpm run test:unit
pnpm run test:integration
```

## Resources

- [README.md](README.md) Project overview
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) API reference
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) Production deployment
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) System architecture
