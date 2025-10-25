# Invoice SaaS - Production-Grade Cloud-Native Application

[![CI/CD](https://github.com/your-org/invoice-saas/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/your-org/invoice-saas/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![AWS](https://img.shields.io/badge/AWS-Infrastructure-orange)](https://aws.amazon.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-EKS-blue)](https://kubernetes.io)

A production-ready invoice management SaaS application built with microservices architecture on AWS infrastructure. Features include automated invoice generation, PDF creation, payment processing, email notifications, and comprehensive monitoring.

## Features

### Core Functionality
- Invoice Management: Create, read, update, delete invoices
- PDF Generation: Automatic PDF creation and S3 storage
- Payment Processing: Stripe integration with webhook handling
- Email Notifications: AWS SES emails with Shopify order context
- User Authentication: JWT-based auth with RBAC
- Real-time Updates: WebSocket support for status changes
- Search & Filtering: Advanced invoice search capabilities
- Dashboard Analytics: Invoice metrics and reporting

### Infrastructure
- Multi-AZ High Availability: 99.9% uptime SLA
- Auto-scaling: Horizontal pod autoscaling (HPA) on all services
- Load Balancing: AWS Application Load Balancer
- Caching: Redis cluster for performance optimization
- Message Queuing: SQS/SNS for async processing
- Monitoring: CloudWatch dashboards and alarms
- Security: VPC isolation, encryption at rest and in transit
- CI/CD: Automated testing and deployment

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [License](#license)

## Architecture

The application follows a microservices architecture deployed on AWS EKS:

```
Frontend (Render) → ALB → API Gateway → Microservices (EKS)
                                        ├── Invoice Service
                                        ├── Payment Service  
                                        ├── User Service
                                        ├── Notification Service
                                        └── Worker Service
                                             ↓
                                    ┌────────────────┐
                                    │ Data Layer     │
                                    ├────────────────┤
                                    │ PostgreSQL RDS │
                                    │ Redis Cache    │
                                    │ S3 Storage     │
                                    │ SQS Queues     │
                                    └────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Technology Stack

### Backend
- Runtime: Node.js 20 LTS
- Language: TypeScript
- Framework: Express.js
- ORM: Prisma
- Validation: Joi
- Authentication: JWT

### Frontend
- Framework: React 18
- Language: TypeScript
- Styling: Tailwind CSS
- State: React Context
- Testing: React Testing Library, Playwright

### Infrastructure
- Cloud: AWS (VPC, EKS, RDS, ElastiCache, S3, SQS, SNS)
- Container Orchestration: Kubernetes (EKS)
- IaC: Terraform
- CI/CD: GitHub Actions

### Databases
- Primary: PostgreSQL 15 (Multi-AZ)
- Cache: Redis 7 (Cluster Mode)
- Storage: S3 (with lifecycle policies)

### DevOps
- Containerization: Docker
- Orchestration: Kubernetes + Helm
- Monitoring: CloudWatch, Prometheus
- Logging: CloudWatch Logs
- Tracing: AWS X-Ray

## Prerequisites

- Node.js 20+ and pnpm 8+
- Docker 24+
- AWS CLI v2
- Terraform 1.5+
- kubectl 1.28+
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/invoice-saas.git
cd invoice-saas
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Local Development

```bash
# Start all services locally
pnpm dev

# Start individual services
pnpm --filter @invoice-saas/api-gateway dev
pnpm --filter @invoice-saas/invoice-service dev
```

### 5. Run Tests

```bash
# Run all tests
pnpm run test:all

# Or run specific test suites
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
```

### 6. Deploy to AWS

```bash
# Initialize infrastructure
cd infrastructure/terraform
terraform init
terraform plan -var-file="environments/prod/terraform.tfvars"
terraform apply

# Deploy to Kubernetes
kubectl apply -k infrastructure/kubernetes/overlays/prod
```

See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

## Project Structure

```
.
├── infrastructure/
│   ├── terraform/               # Terraform IaC
│   │   ├── modules/            # Reusable modules (VPC, EKS, RDS, etc.)
│   │   ├── environments/       # Environment-specific configs
│   │   └── main.tf
│   └── kubernetes/             # Kubernetes manifests
│       ├── base/               # Base configurations
│       └── overlays/           # Environment overlays
├── services/                   # Microservices
│   ├── api-gateway/           # API Gateway service
│   ├── invoice-service/       # Invoice management
│   ├── payment-service/       # Payment processing
│   ├── notification-service/  # Email/SMS notifications
│   ├── user-service/          # Authentication & users
│   └── worker-service/        # Background jobs
├── apps/
│   ├── web/                   # React frontend application
│   └── api/                   # Unified API layer
├── packages/
│   └── shared/                # Shared utilities
├── scripts/                    # Automation scripts
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── DEPLOYMENT_GUIDE.md    # Deployment instructions
│   ├── COST_ANALYSIS.md       # Cost breakdown
│   └── DATABASE.md            # Database documentation
├── .github/
│   └── workflows/             # CI/CD pipelines
├── package.json               # Root package.json
└── README.md                  # This file
```

## Development

### Local Development Setup

1. Start Infrastructure Services:
```bash
docker-compose up -d postgres redis localstack
```

2. Run Database Migrations:
```bash
pnpm --filter @invoice-saas/invoice-service prisma:migrate
```

3. Start Development Servers:
```bash
# All services
pnpm dev
```

### Code Quality

```bash
# Linting
pnpm run lint

# Type checking
pnpm run typecheck

# Formatting
pnpm run format
```

### Debugging

```bash
# Enable debug logs
export LOG_LEVEL=debug
pnpm dev

# Debug specific service
NODE_OPTIONS='--inspect' pnpm --filter @invoice-saas/invoice-service dev
```

## Deployment

### Production Deployment

```bash
# 1. Deploy infrastructure
cd infrastructure/terraform
terraform apply -var-file="environments/prod/terraform.tfvars"

# 2. Build and push Docker images
pnpm run docker:build
pnpm run docker:push

# 3. Deploy to Kubernetes
kubectl apply -k infrastructure/kubernetes/overlays/prod

# 4. Verify deployment
kubectl get pods -n invoice-saas
kubectl get svc -n invoice-saas
```

### Rollback

```bash
kubectl rollout undo deployment/invoice-service -n invoice-saas
```

### Health Checks

```bash
kubectl exec -n invoice-saas deployment/api-gateway -- curl http://localhost:3000/health
```

## Testing

### Automated Testing

```bash
# Run complete test suite
bash scripts/test-runner.sh
```

The test runner automatically:
1. Validates Terraform configurations
2. Runs unit tests for all services
3. Executes integration tests
4. Validates Kubernetes manifests
5. Builds Docker images
6. Runs E2E tests
7. Retries failed tests up to 3 times
8. Generates detailed failure reports

### Manual Testing

```bash
# Unit tests
pnpm run test:unit

# Integration tests (requires PostgreSQL and Redis)
pnpm run test:integration

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:coverage
```

### Load Testing

```bash
# Using k6
k6 run scripts/load-test.js

# Or using Artillery
artillery run scripts/load-test.yml
```

## API Documentation

API documentation is available at `/api-docs` when running the API Gateway.

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API reference.

### Authentication

Endpoints:
- POST /api/auth/register - Create a new user and receive a JWT
- POST /api/auth/login - Authenticate and receive a JWT
- POST /api/auth/refresh - Rotate refresh token and return new access token
- POST /api/auth/logout - Revoke refresh token
- GET /api/auth/me - Get authenticated user profile

Tokens:
- Access: JWT (HS256) signed with JWT_SECRET, expires in 15 minutes
- Refresh: JWT (HS256) signed with REFRESH_TOKEN_SECRET, stored as HttpOnly cookie, expires in 7 days

Rate Limits:
- Global: 100 requests / 15 minutes per IP
- Auth endpoints: 10 requests / 15 minutes per IP + email

### Security

The platform implements multiple security layers:
- CSRF Protection with double-submit tokens
- Input Validation & Sanitization using Joi schemas
- XSS mitigation
- HTTP Parameter Pollution (HPP) blocking
- Secure headers via Helmet (HSTS, X-Content-Type-Options, etc.)
- CORS restricted to ALLOWED_ORIGINS
- Rate limiting on all endpoints

### Sample API Calls

#### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

#### Create Invoice
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "clientName": "Acme Corp",
    "clientEmail": "billing@acme.com",
    "amount": 1000.00,
    "currency": "USD",
    "dueDate": "2024-12-31",
    "items": [
      {
        "description": "Consulting Services",
        "quantity": 10,
        "unitPrice": 100.00
      }
    ]
  }'
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
