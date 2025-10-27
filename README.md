# Invoice SaaS

Production-grade invoice management platform built on cloud-native microservices architecture.

## Overview

**Core Capabilities**
- Invoice lifecycle management
- Automated PDF generation with S3 storage
- Payment processing via Stripe
- Multi-channel notifications
- JWT authentication with role-based access
- Real-time status updates
- Advanced search and analytics

**Infrastructure**
- Multi-AZ deployment with 99.9% uptime
- Auto-scaling microservices on Kubernetes
- Redis caching and message queuing
- Comprehensive monitoring and observability
- End-to-end encryption and VPC isolation

## Architecture

```
Frontend → ALB → API Gateway → Microservices (EKS)
                              ├─ Invoice Service
                              ├─ Payment Service  
                              ├─ User Service
                              ├─ Notification Service
                              └─ Worker Service
                                     ↓
                              ┌──────────────┐
                              │ PostgreSQL   │
                              │ Redis        │
                              │ S3           │
                              │ SQS          │
                              └──────────────┘
```

Detailed architecture documentation available in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Technology Stack

**Backend**
- Node.js 20, TypeScript, Express.js
- Prisma ORM, Joi validation
- JWT authentication

**Frontend**
- React 18, TypeScript, Tailwind CSS
- React Testing Library, Playwright

**Infrastructure**
- AWS EKS, RDS, ElastiCache, S3, SQS
- Terraform, GitHub Actions
- Docker, Kubernetes, Helm

**Data**
- PostgreSQL 15 (Multi-AZ)
- Redis 7 (Cluster)
- S3 with lifecycle policies

**Observability**
- CloudWatch, Prometheus, X-Ray

## Getting Started

**Requirements**
- Node.js 20+, pnpm 8+, Docker 24+
- AWS CLI v2, Terraform 1.5+, kubectl 1.28+

**Setup**

```bash
# Clone and install
git clone https://github.com/your-org/invoice-saas.git
cd invoice-saas
pnpm install

# Configure environment
cp .env.example .env

# Start local development
pnpm dev

# Run tests
pnpm run test:all
```

**Deploy to AWS**

```bash
# Provision infrastructure
cd infrastructure/terraform
terraform init && terraform apply

# Deploy services
kubectl apply -k infrastructure/kubernetes/overlays/prod
```

See [QUICK_START.md](QUICK_START.md) for detailed instructions.

## Project Structure

```
.
├── infrastructure/
│   ├── terraform/          # IaC modules and environments
│   └── kubernetes/         # K8s manifests and overlays
├── services/
│   ├── api-gateway/
│   ├── invoice-service/
│   ├── payment-service/
│   ├── notification-service/
│   ├── user-service/
│   └── worker-service/
├── apps/
│   ├── web/                # React frontend
│   └── api/                # API layer
├── packages/
│   └── shared/             # Shared utilities
├── docs/                   # Technical documentation
└── scripts/                # Automation
```

## Development

**Local Setup**

```bash
# Start infrastructure
docker-compose up -d postgres redis localstack

# Run migrations
pnpm --filter @invoice-saas/invoice-service prisma:migrate

# Start services
pnpm dev
```

**Code Quality**

```bash
pnpm run lint
pnpm run typecheck
pnpm run format
```

**Debugging**

```bash
# Debug mode
export LOG_LEVEL=debug
pnpm dev

# Inspect specific service
NODE_OPTIONS='--inspect' pnpm --filter @invoice-saas/invoice-service dev
```

## Deployment

**Production**

```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform apply -var-file="environments/prod/terraform.tfvars"

# Build and deploy
pnpm run docker:build && pnpm run docker:push
kubectl apply -k infrastructure/kubernetes/overlays/prod

# Verify
kubectl get pods -n invoice-saas
```

**Rollback**

```bash
kubectl rollout undo deployment/invoice-service -n invoice-saas
```

**Health Checks**

```bash
kubectl exec -n invoice-saas deployment/api-gateway -- curl http://localhost:3000/health
```

## Testing

**Automated Suite**

```bash
bash scripts/test-runner.sh
```

Validates infrastructure, runs unit/integration/E2E tests, builds images, and generates reports.

**Manual Testing**

```bash
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
pnpm run test:coverage
```

**Load Testing**

```bash
k6 run scripts/load-test.js
```

## API

Interactive documentation available at `/api-docs` when running locally.

Full reference: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

**Authentication**

JWT-based authentication with 15-minute access tokens and 7-day refresh tokens.

```bash
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

**Security**

CSRF protection, input validation, XSS mitigation, secure headers, CORS restrictions, and rate limiting.

**Rate Limits**
- Global: 100 requests per 15 minutes
- Auth: 10 requests per 15 minutes

**Example Request**

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Acme Corp",
    "amount": 1000.00,
    "currency": "USD",
    "dueDate": "2024-12-31"
  }'
```

## Documentation

Complete documentation available at [docs/INDEX.md](docs/INDEX.md).

**Quick Access**
- [Documentation Guide](DOCUMENTATION_GUIDE.md) - How to navigate documentation
- [Documentation Map](.docs-map.md) - Quick navigation reference
- [API Versioning](docs/API_VERSIONING.md) - Version strategy
- [Operations Runbook](docs/RUNBOOK.md) - Production operations
- [SLA](docs/SLA.md) - Service level agreements
- [Testing Strategy](docs/TESTING_STRATEGY.md) - QA approach

## License

MIT License - see [LICENSE](LICENSE) file for details.
