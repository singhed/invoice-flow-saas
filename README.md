# Invoice SaaS - Production-Grade Cloud-Native Application

[![CI/CD](https://github.com/your-org/invoice-saas/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/your-org/invoice-saas/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![AWS](https://img.shields.io/badge/AWS-Infrastructure-orange)](https://aws.amazon.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-EKS-blue)](https://kubernetes.io)

A complete, production-ready invoice management SaaS application built with microservices architecture on AWS infrastructure. Features include automated invoice generation, PDF creation, payment processing, email notifications, and comprehensive monitoring.

## 🚀 Features

### Core Functionality
- ✅ **Invoice Management**: Create, read, update, delete invoices
- ✅ **PDF Generation**: Automatic PDF creation and S3 storage
- ✅ **Payment Processing**: Stripe integration with webhook handling
- ✅ **Email Notifications**: Automated invoice delivery via SendGrid/SES
- ✅ **User Authentication**: JWT-based auth with RBAC
- ✅ **Real-time Updates**: WebSocket support for status changes
- ✅ **Search & Filtering**: Advanced invoice search capabilities
- ✅ **Dashboard Analytics**: Invoice metrics and reporting

### Infrastructure
- ✅ **Multi-AZ High Availability**: 99.9% uptime SLA
- ✅ **Auto-scaling**: Horizontal pod autoscaling (HPA) on all services
- ✅ **Load Balancing**: AWS Application Load Balancer
- ✅ **Caching**: Redis cluster for performance optimization
- ✅ **Message Queuing**: SQS/SNS for async processing
- ✅ **Monitoring**: CloudWatch dashboards and alarms
- ✅ **Security**: VPC isolation, encryption at rest and in transit
- ✅ **CI/CD**: Automated testing and deployment

## 📋 Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Monitoring](#monitoring)
- [Cost Analysis](#cost-analysis)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ Architecture

The application follows a microservices architecture deployed on AWS EKS with the following components:

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

**Detailed Architecture**: See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Validation**: Joi
- **Authentication**: JWT

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context
- **Testing**: React Testing Library, Playwright

### Infrastructure
- **Cloud**: AWS (VPC, EKS, RDS, ElastiCache, S3, SQS, SNS)
- **Container Orchestration**: Kubernetes (EKS)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

### Databases
- **Primary**: PostgreSQL 15 (Multi-AZ)
- **Cache**: Redis 7 (Cluster Mode)
- **Storage**: S3 (with lifecycle policies)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes + Helm
- **Monitoring**: CloudWatch, Prometheus
- **Logging**: CloudWatch Logs
- **Tracing**: AWS X-Ray

## 📦 Prerequisites

- Node.js 20+ and pnpm 8+
- Docker 24+
- AWS CLI v2
- Terraform 1.5+
- kubectl 1.28+
- Git

## 🚀 Quick Start

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
# Run all tests with retry logic
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

**Detailed Setup**: See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

## 📁 Project Structure

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
├── frontend/                   # React application
├── packages/
│   └── shared/                # Shared utilities
├── scripts/                    # Automation scripts
│   └── test-runner.sh         # Test automation with retry
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── DEPLOYMENT_GUIDE.md    # Deployment instructions
│   ├── COST_ANALYSIS.md       # Cost breakdown
│   └── API_DOCUMENTATION.md   # API reference
├── .github/
│   └── workflows/             # CI/CD pipelines
├── package.json               # Root package.json
└── README.md                  # This file
```

## 💻 Development

### Local Development Setup

1. **Start Infrastructure Services**:
```bash
# Using Docker Compose
docker-compose up -d postgres redis localstack
```

2. **Run Database Migrations**:
```bash
pnpm --filter @invoice-saas/invoice-service prisma:migrate
```

3. **Start Development Servers**:
```bash
# All services
pnpm dev

# Watch mode with hot reload
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

## 🚀 Deployment

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
# Check all services
kubectl exec -n invoice-saas deployment/api-gateway -- curl http://localhost:3000/health
```

## 🧪 Testing

### Automated Testing with Retry Logic

The project includes comprehensive automated testing with built-in retry logic:

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
7. **Retries failed tests up to 3 times**
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

## 📚 API Documentation

API documentation is available at `/api-docs` when running the API Gateway.

**Detailed API Reference**: See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

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

### Authentication & Rate Limiting

This repository ships with a working authentication flow behind the API Gateway and a strict rate limiting policy:

- Endpoints (via API Gateway):
  - POST /api/auth/register → Create a new user and receive a JWT
  - POST /api/auth/login → Authenticate and receive a JWT
  - GET /api/auth/me → Get the authenticated user's profile
- Token: JWT (HS256) signed with JWT_SECRET. Provide as Authorization: Bearer <token>
- Expiration: 1 hour (configurable in code)
- Rate limits:
  - Global: 100 requests / 15 minutes per IP
  - Auth endpoints: 10 requests / 15 minutes per IP + email combination

Local development quickstart:

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env and edit secrets
cp .env.example .env

# 3. Start services
# API Gateway (http://localhost:3000)
pnpm --filter @invoice-saas/api-gateway dev

# User Service with auth endpoints (http://localhost:3003)
pnpm --filter @invoice-saas/user-service dev

# Web frontend (http://localhost:3000 by Next default, if run separately in /apps/web)
pnpm --filter web dev
```

Frontend auth pages are available at:
- /auth/register - create an account
- /auth/login - sign in and store JWT in localStorage

See docs/services/auth-service.md for full details of the implementation.

## 📊 Monitoring

### CloudWatch Dashboards

- **Application Dashboard**: CPU, memory, request rates
- **Database Dashboard**: Connections, query performance
- **Cache Dashboard**: Hit rates, evictions
- **Queue Dashboard**: Message counts, processing times

Access: AWS Console → CloudWatch → Dashboards → `invoice-saas-prod-dashboard`

### Logs

```bash
# Application logs
kubectl logs -n invoice-saas -l app=invoice-service --tail=100 -f

# CloudWatch logs
aws logs tail /aws/eks/invoice-saas-prod/application --follow
```

### Metrics

Key metrics monitored:
- API response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- Database query performance
- Cache hit rates
- Queue depths
- Resource utilization

### Alarms

Critical alarms configured for:
- High error rates (>5%)
- Slow response times (p95 >1s)
- Database CPU >80%
- Low disk space
- Node health issues

## 💰 Cost Analysis

### Monthly Cost Breakdown

| Category | Cost | Optimized Cost |
|----------|------|----------------|
| **Compute (EKS)** | $467 | $280 (with Spot) |
| **Database (RDS)** | $438 | $253 (with RI) |
| **Cache (Redis)** | $657 | $357 (with RI) |
| **Networking** | $165 | $100 |
| **Storage** | $121 | $99 |
| **Other** | $90 | $90 |
| **Total** | **~$1,938** | **~$1,179** |

**Annual Budget**: ~$14,148 (optimized) / ~$23,256 (unoptimized)

**Detailed Analysis**: See [docs/COST_ANALYSIS.md](docs/COST_ANALYSIS.md)

### Cost Optimization

- Use Spot Instances for 70% of workload (42% savings)
- Purchase Reserved Instances for RDS/Redis (40-45% savings)
- Implement S3 lifecycle policies (30% savings on storage)
- Use VPC endpoints to reduce NAT costs (20% savings)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier
- Write tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Powered by [AWS](https://aws.amazon.com/)
- Orchestrated with [Kubernetes](https://kubernetes.io/)
- Infrastructure managed by [Terraform](https://www.terraform.io/)

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/invoice-saas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/invoice-saas/discussions)

## 🗺️ Roadmap

- [ ] Multi-tenancy support
- [ ] Advanced analytics dashboard
- [ ] Recurring invoice automation
- [ ] Multi-currency support
- [ ] Mobile applications (iOS/Android)
- [ ] Webhook integrations
- [ ] Advanced reporting (PDF/Excel exports)
- [ ] Invoice templates customization
- [ ] Payment gateway integrations (PayPal, Square)
- [ ] Multi-language support

## 📈 Project Status

- ✅ **Infrastructure**: Production-ready
- ✅ **Backend Services**: Fully implemented
- ✅ **Frontend**: Basic implementation
- ✅ **Testing**: Comprehensive coverage
- ✅ **CI/CD**: Automated pipelines
- ✅ **Monitoring**: CloudWatch integration
- ✅ **Documentation**: Complete

---

**Built with ❤️ for production-scale invoice management**
