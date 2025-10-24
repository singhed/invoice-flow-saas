# Scaling Implementation Guide - Supporting 1 Million Users

## Quick Start

This guide provides step-by-step instructions for deploying and configuring the Invoice SaaS platform to support 1 million users.

---

## Prerequisites

### Required Tools
```bash
# Install required tools
brew install kubectl terraform helm k6 aws-cli
# Or for Linux
apt-get install kubectl terraform

# Verify installations
kubectl version --client
terraform version
helm version
k6 version
aws --version
```

### AWS Configuration
```bash
# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

---

## Step 1: Infrastructure Deployment

### 1.1 Deploy Multi-Region Database

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Create workspace for production
terraform workspace new prod
terraform workspace select prod

# Review the plan
terraform plan \
  -var="environment=prod" \
  -var="primary_region=us-east-1" \
  -var="secondary_region=us-west-2" \
  -var-file="environments/prod/terraform.tfvars"

# Apply configuration
terraform apply \
  -var="environment=prod" \
  -var="primary_region=us-east-1" \
  -var="secondary_region=us-west-2" \
  -var-file="environments/prod/terraform.tfvars"

# Save outputs
terraform output > outputs.txt
```

### 1.2 Deploy Redis Cluster

```bash
# Deploy Redis
terraform apply -target=module.redis_cluster

# Get Redis endpoints
terraform output redis_primary_endpoint
terraform output redis_cluster_configuration_endpoint
```

### 1.3 Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Update with Terraform outputs
# Edit .env and add:
# - Database endpoints
# - Redis endpoints
# - Auth tokens from AWS Secrets Manager

# Get Redis auth token
aws secretsmanager get-secret-value \
  --secret-id prod/invoice-saas/redis/auth-token \
  --query SecretString \
  --output text
```

---

## Step 2: Kubernetes Cluster Setup

### 2.1 Create EKS Clusters

```bash
# Primary region (us-east-1)
eksctl create cluster \
  --name invoice-saas-prod-primary \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type c6i.2xlarge \
  --nodes 20 \
  --nodes-min 20 \
  --nodes-max 200 \
  --managed \
  --asg-access \
  --external-dns-access \
  --full-ecr-access \
  --alb-ingress-access

# Secondary region (us-west-2)
eksctl create cluster \
  --name invoice-saas-prod-secondary \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type c6i.2xlarge \
  --nodes 20 \
  --nodes-min 20 \
  --nodes-max 200 \
  --managed \
  --asg-access \
  --external-dns-access \
  --full-ecr-access \
  --alb-ingress-access

# Verify clusters
kubectl get nodes --context=invoice-saas-prod-primary
kubectl get nodes --context=invoice-saas-prod-secondary
```

### 2.2 Install Cluster Autoscaler

```bash
# Apply cluster autoscaler
kubectl apply -f infrastructure/kubernetes/base/cluster-autoscaler.yaml

# Verify installation
kubectl get deployment cluster-autoscaler -n kube-system
kubectl logs -f deployment/cluster-autoscaler -n kube-system
```

### 2.3 Install Metrics Server

```bash
# Install metrics server for HPA
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify
kubectl get deployment metrics-server -n kube-system
```

---

## Step 3: Application Deployment

### 3.1 Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build all services
pnpm run docker:build

# Tag and push
for service in api-gateway invoice-service analytics-service search-service user-service; do
  docker tag invoice-saas-$service:latest \
    <account-id>.dkr.ecr.us-east-1.amazonaws.com/invoice-saas-$service:latest
  docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/invoice-saas-$service:latest
done
```

### 3.2 Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace invoice-saas

# Create secrets
kubectl create secret generic database-credentials \
  --from-literal=username=$DB_USER \
  --from-literal=password=$DB_PASSWORD \
  -n invoice-saas

kubectl create secret generic redis-credentials \
  --from-literal=password=$REDIS_PASSWORD \
  -n invoice-saas

# Deploy services
kubectl apply -k infrastructure/kubernetes/overlays/prod

# Apply HPA
kubectl apply -f infrastructure/kubernetes/base/hpa.yaml

# Apply PDB
kubectl apply -f infrastructure/kubernetes/base/pdb.yaml

# Verify deployments
kubectl get pods -n invoice-saas
kubectl get hpa -n invoice-saas
kubectl get pdb -n invoice-saas
```

---

## Step 4: Load Balancer Configuration

### 4.1 Deploy Application Load Balancer

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=invoice-saas-prod-primary \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Verify
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### 4.2 Configure Ingress

```yaml
# Create ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: invoice-saas-ingress
  namespace: invoice-saas
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/load-balancer-attributes: idle_timeout.timeout_seconds=60
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/success-codes: "200,201"
spec:
  ingressClassName: alb
  rules:
  - host: api.invoice-saas.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
```

```bash
# Apply ingress
kubectl apply -f ingress.yaml

# Get ALB DNS
kubectl get ingress -n invoice-saas
```

---

## Step 5: Monitoring Setup

### 5.1 Deploy Prometheus

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi

# Verify
kubectl get pods -n monitoring
```

### 5.2 Deploy Grafana Dashboards

```bash
# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Login credentials
username: admin
password: $(kubectl get secret --namespace monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode)
```

### 5.3 Configure Alerts

```yaml
# Create alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: invoice-saas-alerts
  namespace: monitoring
spec:
  groups:
  - name: invoice-saas
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
      for: 5m
      annotations:
        summary: "High error rate detected"
    - alert: HighLatency
      expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 0.5
      for: 5m
      annotations:
        summary: "High latency detected"
```

```bash
kubectl apply -f alerts.yaml
```

---

## Step 6: Load Testing

### 6.1 Run Initial Load Test

```bash
# Small scale test (1000 VUs)
k6 run \
  --vus 1000 \
  --duration 5m \
  --env API_URL=https://api.invoice-saas.com \
  --env API_KEY=your-api-key \
  infrastructure/load-testing/k6-load-test.js

# Review results
cat load-test-results.json
```

### 6.2 Run Full Scale Test

```bash
# Full scale test (50,000 VUs)
k6 run \
  --execution-segment "0:1" \
  --execution-segment-sequence "0,0.25,0.5,0.75,1" \
  --env API_URL=https://api.invoice-saas.com \
  --env API_KEY=your-api-key \
  infrastructure/load-testing/k6-load-test.js

# Monitor during test
watch -n 5 'kubectl top pods -n invoice-saas'
watch -n 5 'kubectl get hpa -n invoice-saas'
```

### 6.3 Analyze Results

```bash
# Check metrics
kubectl port-forward -n monitoring svc/prometheus-prometheus 9090:9090

# Open browser to http://localhost:9090
# Query: rate(http_requests_total[5m])
# Query: histogram_quantile(0.95, http_request_duration_seconds_bucket)
```

---

## Step 7: Performance Optimization

### 7.1 Optimize Database Queries

```sql
-- Create indexes for frequently queried fields
CREATE INDEX CONCURRENTLY idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX CONCURRENTLY idx_invoices_status ON invoices(status);
CREATE INDEX CONCURRENTLY idx_invoices_created_at ON invoices(created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM invoices WHERE customer_id = '123';

-- Enable query stats
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = all;
```

### 7.2 Configure Cache Warming

```typescript
// Add to your application startup
import { cache } from '@invoice-saas/shared';

async function warmCache() {
  // Pre-load frequently accessed data
  const topUsers = await getTopUsers(100000);
  await Promise.all(
    topUsers.map(user => 
      cache.set(`user:${user.id}`, user, { ttl: 3600 })
    )
  );
}

// Run on startup and every 5 minutes
warmCache().then(() => {
  setInterval(warmCache, 5 * 60 * 1000);
});
```

### 7.3 Enable Response Compression

```typescript
// Add to API Gateway
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

---

## Step 8: Cost Optimization

### 8.1 Use Spot Instances

```bash
# Create spot instance node group
eksctl create nodegroup \
  --cluster=invoice-saas-prod-primary \
  --name=spot-workers \
  --node-type=c6i.2xlarge \
  --nodes=50 \
  --nodes-min=30 \
  --nodes-max=150 \
  --spot \
  --instance-types=c6i.2xlarge,c5.2xlarge,c5a.2xlarge

# Add node affinity to deployments for spot instances
kubectl patch deployment api-gateway -n invoice-saas -p '
spec:
  template:
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 1
            preference:
              matchExpressions:
              - key: eks.amazonaws.com/capacityType
                operator: In
                values:
                - SPOT
'
```

### 8.2 Configure S3 Lifecycle Policies

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket invoice-saas-storage \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "MoveOldInvoices",
        "Status": "Enabled",
        "Transitions": [
          {
            "Days": 90,
            "StorageClass": "STANDARD_IA"
          },
          {
            "Days": 365,
            "StorageClass": "GLACIER"
          }
        ]
      }
    ]
  }'
```

---

## Step 9: Security Hardening

### 9.1 Enable WAF

```bash
# Create WAF WebACL
aws wafv2 create-web-acl \
  --name invoice-saas-waf \
  --scope REGIONAL \
  --region us-east-1 \
  --default-action Allow={} \
  --rules file://waf-rules.json

# Associate with ALB
aws wafv2 associate-web-acl \
  --web-acl-arn <web-acl-arn> \
  --resource-arn <alb-arn>
```

### 9.2 Configure Network Policies

```yaml
# Create network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: invoice-saas-network-policy
  namespace: invoice-saas
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: invoice-service
    ports:
    - protocol: TCP
      port: 3001
```

```bash
kubectl apply -f network-policy.yaml
```

---

## Step 10: Disaster Recovery Testing

### 10.1 Test Database Failover

```bash
# Simulate primary region failure
aws rds failover-db-cluster \
  --db-cluster-identifier prod-invoice-saas-primary \
  --region us-east-1

# Monitor application
kubectl logs -f deployment/api-gateway -n invoice-saas

# Verify failover completed
aws rds describe-db-clusters \
  --db-cluster-identifier prod-invoice-saas-primary \
  --region us-east-1
```

### 10.2 Test Cross-Region Failover

```bash
# Update Route 53 to point to secondary region
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://route53-failover.json

# Monitor traffic shift
watch -n 10 'curl -w "%{http_code}\n" -o /dev/null -s https://api.invoice-saas.com/health'
```

---

## Monitoring Checklist

### Daily Checks
- [ ] Check error rates (< 0.1%)
- [ ] Check p95 latency (< 200ms)
- [ ] Check cache hit rate (> 90%)
- [ ] Check database connections (< 80%)
- [ ] Review security alerts

### Weekly Checks
- [ ] Review cost reports
- [ ] Analyze slow queries
- [ ] Check disk usage
- [ ] Review scaling events
- [ ] Update dependencies

### Monthly Checks
- [ ] Run load tests
- [ ] Test disaster recovery
- [ ] Review and optimize costs
- [ ] Security audit
- [ ] Capacity planning review

---

## Troubleshooting

### High Latency

```bash
# Check pod resources
kubectl top pods -n invoice-saas

# Check database
psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check cache
redis-cli --latency

# Scale up if needed
kubectl scale deployment api-gateway --replicas=50 -n invoice-saas
```

### Out of Memory

```bash
# Check memory usage
kubectl top pods -n invoice-saas

# Increase memory limits
kubectl set resources deployment api-gateway \
  --limits=memory=8Gi \
  --requests=memory=4Gi \
  -n invoice-saas
```

### Database Connection Pool Exhausted

```bash
# Check active connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Increase pool size
kubectl set env deployment/api-gateway \
  DB_POOL_MAX=200 \
  -n invoice-saas

# Restart pods
kubectl rollout restart deployment/api-gateway -n invoice-saas
```

---

## Support

For issues or questions:
- Documentation: `/docs`
- Runbooks: `/docs/runbooks`
- Monitoring: https://grafana.invoice-saas.com
- Logs: https://kibana.invoice-saas.com

---

## Next Steps

1. ✅ Complete infrastructure deployment
2. ✅ Deploy application services
3. ✅ Configure monitoring and alerting
4. ✅ Run load tests and validate performance
5. ✅ Test disaster recovery procedures
6. ✅ Optimize costs
7. ✅ Train operations team
8. ✅ Go live with traffic migration

**System is now ready for 1 million users! 🚀**
