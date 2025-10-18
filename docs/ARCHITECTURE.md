# Invoice SaaS Architecture Documentation

## System Overview

This is a production-grade, cloud-native invoice management SaaS application built with a microservices architecture on AWS infrastructure. The system is designed to handle high-scale invoice processing, payment tracking, and notifications with reliability, security, and cost-efficiency in mind.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (us-east-1)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    VPC (10.0.0.0/16)                       │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │         Public Subnets (3 AZs)                        │  │  │
│  │  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────────────┐  │  │  │
│  │  │  │ NAT  │  │ NAT  │  │ NAT  │  │ ALB (Load        │  │  │  │
│  │  │  │ GW 1 │  │ GW 2 │  │ GW 3 │  │ Balancer)        │  │  │  │
│  │  │  └──────┘  └──────┘  └──────┘  └──────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │         Private Subnets (3 AZs)                       │  │  │
│  │  │                                                        │  │  │
│  │  │           ┌────────────────────────────┐             │  │  │
│  │  │           │   EKS Cluster (v1.28+)     │             │  │  │
│  │  │           │                            │             │  │  │
│  │  │           │  ┌──────────────────────┐  │             │  │  │
│  │  │           │  │   API Gateway        │  │             │  │  │
│  │  │           │  │   (2-10 replicas)    │  │             │  │  │
│  │  │           │  └──────────────────────┘  │             │  │  │
│  │  │           │                            │             │  │  │
│  │  │           │  ┌──────────────────────┐  │             │  │  │
│  │  │           │  │ Invoice Service      │  │             │  │  │
│  │  │           │  │ (3-10 replicas)      │  │             │  │  │
│  │  │           │  └──────────────────────┘  │             │  │  │
│  │  │           │                            │             │  │  │
│  │  │           │  ┌──────────────────────┐  │             │  │  │
│  │  │           │  │ Payment Service      │  │             │  │  │
│  │  │           │  │ (2-8 replicas)       │  │             │  │  │
│  │  │           │  └──────────────────────┘  │             │  │  │
│  │  │           │                            │             │  │  │
│  │  │           │  ┌──────────────────────┐  │             │  │  │
│  │  │           │  │ User/Auth Service    │  │             │  │  │
│  │  │           │  │ (2-8 replicas)       │  │             │  │  │
│  │  │           │  └──────────────────────┘  │             │  │  │
│  │  │           │                            │             │  │  │
│  │  │           │  ┌──────────────────────┐  │             │  │  │
│  │  │           │  │ Notification Service │  │             │  │  │
│  │  │           │  │ (2-6 replicas)       │  │             │  │  │
│  │  │           │  └──────────────────────┘  │             │  │  │
│  │  │           │                            │             │  │  │
│  │  │           │  ┌──────────────────────┐  │             │  │  │
│  │  │           │  │ Worker Service       │  │             │  │  │
│  │  │           │  │ (CronJobs)           │  │             │  │  │
│  │  │           │  └──────────────────────┘  │             │  │  │
│  │  │           └────────────────────────────┘             │  │  │
│  │  │                                                        │  │  │
│  │  │           Node Group: t3.large (3-15 nodes)          │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │         Database Subnets (3 AZs)                      │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌────────────────────┐  ┌───────────────────────┐   │  │  │
│  │  │  │ RDS PostgreSQL 15  │  │  ElastiCache Redis    │   │  │  │
│  │  │  │ Multi-AZ           │  │  3 shards + replicas  │   │  │  │
│  │  │  │ db.r6g.large       │  │  cache.r6g.large      │   │  │  │
│  │  │  │ 100-500GB          │  │  Cluster mode         │   │  │  │
│  │  │  └────────────────────┘  └───────────────────────┘   │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │  SQS Queues    │  │  S3 Buckets    │  │  CloudWatch     │   │
│  │  - Invoice     │  │  - Invoices    │  │  - Logs         │   │
│  │  - Payment     │  │  (versioned,   │  │  - Metrics      │   │
│  │  - Email       │  │   encrypted)   │  │  - Alarms       │   │
│  │  (+ DLQs)      │  │                │  │  - Dashboards   │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │  SNS Topics    │  │  Secrets Mgr   │                         │
│  │  - Payment     │  │  - DB Creds    │                         │
│  │  - Invoice     │  │  - Redis Auth  │                         │
│  └────────────────┘  └────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘

                              │
                              │ HTTPS
                              ▼
                    ┌──────────────────┐
                    │  Render.com      │
                    │  React Frontend  │
                    │  (Static Site)   │
                    └──────────────────┘
```

## Technology Stack

### Infrastructure
- **Cloud Provider**: AWS (us-east-1)
- **Container Orchestration**: Amazon EKS (Kubernetes 1.28+)
- **Infrastructure as Code**: Terraform
- **CI/CD**: GitHub Actions

### Backend Services
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **API Documentation**: OpenAPI/Swagger

### Data Layer
- **Primary Database**: PostgreSQL 15 (RDS Multi-AZ)
- **Cache**: Redis 7 (ElastiCache)
- **Message Queue**: AWS SQS
- **Pub/Sub**: AWS SNS
- **Object Storage**: AWS S3

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS / Material-UI
- **State Management**: React Context / Redux
- **Hosting**: Render.com

### Observability
- **Logging**: CloudWatch Logs
- **Metrics**: CloudWatch Metrics, Prometheus
- **Tracing**: AWS X-Ray
- **Monitoring**: CloudWatch Dashboards and Alarms

## Microservices Architecture

### 1. API Gateway Service
**Purpose**: Single entry point for all client requests

**Responsibilities**:
- Request routing and proxying
- JWT authentication and authorization
- Rate limiting (100 requests/15min per IP)
- Request validation
- API documentation (Swagger)
- CORS handling

**Endpoints**: `/api/*`
**Scaling**: 2-10 replicas (HPA on CPU/Memory)

### 2. Invoice Service
**Purpose**: Core invoice management functionality

**Responsibilities**:
- Invoice CRUD operations
- PDF generation (puppeteer/pdfkit)
- Invoice numbering (sequential)
- Status workflow (draft → sent → paid → overdue)
- S3 integration for PDF storage
- Redis caching for frequently accessed invoices
- SQS message publishing for async tasks

**Endpoints**: `/api/invoices/*`
**Database**: PostgreSQL (invoices, invoice_items tables)
**Cache**: Redis
**Scaling**: 3-10 replicas

### 3. Payment Service
**Purpose**: Payment processing and tracking

**Responsibilities**:
- Stripe webhook handling
- Payment status tracking
- Payment reconciliation
- Transaction history
- SNS event publishing

**Endpoints**: `/api/payments/*`
**Database**: PostgreSQL (payments table)
**Scaling**: 2-8 replicas

### 4. User/Auth Service
**Purpose**: User management and authentication

**Responsibilities**:
- User registration
- User authentication (JWT)
- Password hashing (bcrypt)
- Role-based access control (RBAC)
- Session management (Redis)

**Endpoints**: `/api/users/*`, `/api/auth/*`
**Database**: PostgreSQL (users table)
**Cache**: Redis (sessions)
**Scaling**: 2-8 replicas

### 5. Notification Service
**Purpose**: Email and notification delivery

**Responsibilities**:
- Email sending (SendGrid/SES)
- Template rendering
- SQS message consumption
- Retry logic with exponential backoff

**Queue Consumer**: SQS email queue
**Scaling**: 2-6 replicas

### 6. Worker Service
**Purpose**: Background job processing

**Responsibilities**:
- Overdue invoice checks (cron)
- Batch processing
- SQS message processing
- Scheduled tasks

**Type**: Kubernetes CronJobs
**Scaling**: As needed

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'draft',
  due_date DATE NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Invoice Items Table
```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Implementation

### Network Security
- VPC with private subnets for EKS and databases
- Security groups with least-privilege access
- Network policies in Kubernetes
- WAF rules on ALB (optional)

### Application Security
- JWT-based authentication
- Bcrypt password hashing (12 rounds)
- SQL injection prevention (Prisma ORM)
- XSS protection (Helmet middleware)
- CORS configuration
- Rate limiting
- Input validation (Joi)

### Data Security
- RDS encryption at rest (AES-256)
- ElastiCache encryption in transit and at rest
- S3 bucket encryption
- Secrets Manager for credentials
- IAM roles with least privilege

## Scaling and Performance

### Auto-scaling Configuration
- **EKS Nodes**: 3-15 nodes (Cluster Autoscaler)
- **API Gateway**: 2-10 pods (HPA @ 70% CPU)
- **Invoice Service**: 3-10 pods (HPA @ 70% CPU)
- **Payment Service**: 2-8 pods (HPA @ 70% CPU)
- **User Service**: 2-8 pods (HPA @ 70% CPU)
- **Notification Service**: 2-6 pods (HPA @ 70% CPU)

### Performance Optimizations
- Redis caching for frequently accessed data
- Database indexing on foreign keys and lookup fields
- Connection pooling
- CDN for frontend static assets
- S3 Transfer Acceleration for large PDFs
- Database query optimization

### Load Testing Targets
- API Gateway: 1000 req/s
- Invoice creation: 100 req/s
- Database connections: 200 concurrent

## Cost Optimization

### Budget Breakdown (Estimated Monthly)
- **EKS**: $1,500 (cluster + nodes)
- **RDS**: $400 (db.r6g.large Multi-AZ)
- **ElastiCache**: $600 (3x cache.r6g.large)
- **NAT Gateways**: $300 (3x NAT)
- **ALB**: $50
- **S3**: $100 (1TB storage + requests)
- **SQS/SNS**: $50
- **CloudWatch**: $100
- **Data Transfer**: $200
- **Render (Frontend)**: $50

**Total**: ~$3,350/month (~$40,200/year)

### Cost Optimization Strategies
1. Use Spot Instances for non-critical workloads (50-70% savings)
2. Reserved Instances for RDS/ElastiCache (40% savings)
3. Auto-scaling to scale down during low usage
4. S3 lifecycle policies (Standard → IA → Glacier)
5. CloudWatch log retention optimization
6. EKS Fargate for sporadic workloads
7. Right-sizing based on actual usage metrics

## Disaster Recovery

### Backup Strategy
- **RDS**: Automated daily backups (7-day retention)
- **RDS**: Point-in-time recovery
- **S3**: Versioning enabled
- **Configuration**: Infrastructure as Code (Terraform)

### High Availability
- Multi-AZ deployments for RDS and ElastiCache
- EKS nodes across 3 availability zones
- ALB with health checks and automatic failover
- Database read replicas (optional)

### Recovery Objectives
- **RTO** (Recovery Time Objective): < 1 hour
- **RPO** (Recovery Point Objective): < 5 minutes

## Monitoring and Alerting

### Key Metrics
- API response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- Request throughput
- Database performance (CPU, connections, slow queries)
- Redis hit rate
- SQS queue depth
- EKS node health
- Pod resource utilization

### Critical Alarms
- RDS CPU > 80%
- RDS storage < 10GB
- Redis memory > 90%
- EKS node count < 2
- API error rate > 5%
- SQS queue depth > 1000

## Testing Strategy

### Unit Tests
- Jest for all backend services
- React Testing Library for frontend
- Target: >70% code coverage
- Mock external dependencies

### Integration Tests
- Supertest for API endpoints
- Testcontainers for database/Redis
- SQS/SNS integration tests

### End-to-End Tests
- Playwright/Cypress for full workflows
- User registration → login → invoice creation → payment

### Infrastructure Tests
- Terraform validate and plan
- Kubernetes manifest validation (kubectl dry-run)
- Helm chart linting

### Automated Test Execution
- Pre-commit hooks for linting
- GitHub Actions CI pipeline
- Automated retry logic (3 attempts)
- Detailed failure reporting

## Deployment Strategy

### Blue-Green Deployment
1. Deploy new version alongside current
2. Run smoke tests on new version
3. Switch traffic to new version
4. Monitor for issues
5. Rollback if needed

### Rollback Procedure
```bash
kubectl rollout undo deployment/invoice-service -n invoice-saas
```

### Zero-Downtime Deployments
- Rolling updates in Kubernetes
- Pod disruption budgets
- Health checks (liveness/readiness probes)
- Graceful shutdown handling

## Development Workflow

1. Create feature branch from `main`
2. Develop and test locally
3. Push to GitHub
4. Automated CI tests run
5. Create pull request
6. Code review
7. Merge to `main`
8. Automated deployment to production
9. Post-deployment verification

## Future Enhancements

- Multi-tenancy support
- Advanced reporting and analytics
- Invoice templates customization
- Recurring invoices
- Multi-currency support
- Mobile applications (React Native)
- Webhook support for integrations
- Advanced audit logging
- Machine learning for fraud detection
- GraphQL API option
