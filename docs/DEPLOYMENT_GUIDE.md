# Deployment Guide

## Prerequisites

### Required Tools
- AWS CLI v2.x
- Terraform >= 1.5.0
- kubectl >= 1.28
- Node.js 20 LTS
- pnpm 8.15.8
- Docker >= 24.0
- Git

### AWS Account Setup
1. AWS account with administrative access
2. AWS CLI configured with credentials
3. S3 bucket for Terraform state (create manually first)
4. DynamoDB table for Terraform state locks

### GitHub Secrets Required
```bash
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
RENDER_DEPLOY_HOOK_URL
API_GATEWAY_URL (after deployment)
```

## Step 1: Infrastructure Deployment

### 1.1 Create S3 Backend for Terraform

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket invoice-saas-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket invoice-saas-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket invoice-saas-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locks
aws dynamodb create-table \
  --table-name invoice-saas-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 1.2 Initialize and Apply Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init \
  -backend-config="environments/prod/backend.tf"

# Review the plan
terraform plan \
  -var-file="environments/prod/terraform.tfvars" \
  -out=tfplan

# Apply the infrastructure
terraform apply tfplan
```

**Expected Duration**: 30-45 minutes

**Resources Created**:
- VPC with 3 public, 3 private, and 3 database subnets
- 3 NAT Gateways
- EKS cluster with node group (3 nodes initially)
- RDS PostgreSQL Multi-AZ instance
- ElastiCache Redis cluster
- SQS queues (3) and DLQs (3)
- SNS topics (2)
- S3 bucket for invoices
- CloudWatch log groups and dashboards
- IAM roles and policies
- Security groups

### 1.3 Capture Terraform Outputs

```bash
# Save outputs to file
terraform output -json > outputs.json

# Display key outputs
terraform output
```

**Important Outputs**:
- EKS cluster name
- RDS endpoint and credentials
- Redis endpoint
- SQS queue URLs
- S3 bucket name

## Step 2: Configure kubectl for EKS

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --name invoice-saas-prod \
  --region us-east-1

# Verify connection
kubectl get nodes
kubectl get namespaces
```

## Step 3: Install Kubernetes Add-ons

### 3.1 AWS Load Balancer Controller

```bash
# Create IAM OIDC provider (already done by Terraform)
# Install AWS Load Balancer Controller

# Add EKS chart repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=invoice-saas-prod \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=us-east-1 \
  --set vpcId=$(terraform output -raw vpc_id)

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### 3.2 Cluster Autoscaler

```bash
# Create service account (already done by Terraform)
# Install Cluster Autoscaler

kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  labels:
    app: cluster-autoscaler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.28.0
        name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/invoice-saas-prod
        volumeMounts:
        - name: ssl-certs
          mountPath: /etc/ssl/certs/ca-certificates.crt
          readOnly: true
      volumes:
      - name: ssl-certs
        hostPath:
          path: /etc/ssl/certs/ca-bundle.crt
EOF

# Verify installation
kubectl get deployment -n kube-system cluster-autoscaler
```

### 3.3 Metrics Server

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify
kubectl get deployment metrics-server -n kube-system
```

## Step 4: Create Kubernetes Secrets

### 4.1 Update Secrets with Real Values

```bash
# Get RDS credentials from Terraform outputs
export RDS_HOST=$(terraform output -raw rds_endpoint | cut -d: -f1)
export RDS_PASSWORD=$(terraform output -raw rds_password)
export REDIS_HOST=$(terraform output -raw redis_endpoint)

# Create app secrets
kubectl create secret generic app-secrets \
  -n invoice-saas \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --dry-run=client -o yaml | kubectl apply -f -

# Create RDS credentials secret
kubectl create secret generic rds-credentials \
  -n invoice-saas \
  --from-literal=host=$RDS_HOST \
  --from-literal=port=5432 \
  --from-literal=username=dbadmin \
  --from-literal=password=$RDS_PASSWORD \
  --from-literal=database=invoicedb \
  --from-literal=url="postgresql://dbadmin:$RDS_PASSWORD@$RDS_HOST:5432/invoicedb" \
  --dry-run=client -o yaml | kubectl apply -f -

# Create Redis credentials secret
export REDIS_AUTH_TOKEN=$(terraform output -raw redis_auth_token)
kubectl create secret generic redis-credentials \
  -n invoice-saas \
  --from-literal=host=$REDIS_HOST \
  --from-literal=port=6379 \
  --from-literal=auth_token=$REDIS_AUTH_TOKEN \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 4.2 Update ConfigMap with Real Values

```bash
# Get S3 and SQS values from Terraform
export S3_BUCKET=$(terraform output -raw s3_invoice_bucket_name)
export SQS_INVOICE_URL=$(terraform output -raw sqs_invoice_processing_queue_url)
export SQS_PAYMENT_URL=$(terraform output -raw sqs_payment_notification_queue_url)
export SQS_EMAIL_URL=$(terraform output -raw sqs_email_queue_url)

# Update ConfigMap
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: invoice-saas
data:
  s3-bucket-name: "$S3_BUCKET"
  sqs-invoice-queue-url: "$SQS_INVOICE_URL"
  sqs-payment-queue-url: "$SQS_PAYMENT_URL"
  sqs-email-queue-url: "$SQS_EMAIL_URL"
  aws-region: "us-east-1"
EOF
```

## Step 5: Build and Push Docker Images

### 5.1 Create ECR Repositories

```bash
# Create ECR repositories for each service
for service in api-gateway invoice-service payment-service notification-service user-service worker-service; do
  aws ecr create-repository \
    --repository-name invoice-saas-$service \
    --region us-east-1 \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256
done
```

### 5.2 Build and Push Images

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# Set variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push each service
cd services/api-gateway
docker build -t $ECR_REGISTRY/invoice-saas-api-gateway:latest .
docker push $ECR_REGISTRY/invoice-saas-api-gateway:latest

cd ../invoice-service
docker build -t $ECR_REGISTRY/invoice-saas-invoice-service:latest .
docker push $ECR_REGISTRY/invoice-saas-invoice-service:latest

# Repeat for other services...
```

## Step 6: Deploy to Kubernetes

### 6.1 Update Image References

```bash
# Update deployment manifests with ECR image URLs
export ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Use kustomize to set images
cd infrastructure/kubernetes/overlays/prod
kustomize edit set image \
  invoice-saas-api-gateway=$ECR_REGISTRY/invoice-saas-api-gateway:latest \
  invoice-saas-invoice-service=$ECR_REGISTRY/invoice-saas-invoice-service:latest
```

### 6.2 Apply Kubernetes Manifests

```bash
# Apply all resources
kubectl apply -k infrastructure/kubernetes/overlays/prod

# Watch rollout
kubectl rollout status deployment/api-gateway -n invoice-saas
kubectl rollout status deployment/invoice-service -n invoice-saas
```

### 6.3 Verify Deployments

```bash
# Check pods
kubectl get pods -n invoice-saas

# Check services
kubectl get svc -n invoice-saas

# Check HPA
kubectl get hpa -n invoice-saas

# Check logs
kubectl logs -n invoice-saas -l app=api-gateway --tail=50
```

## Step 7: Run Database Migrations

```bash
# Get a pod name
INVOICE_POD=$(kubectl get pods -n invoice-saas -l app=invoice-service -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -n invoice-saas $INVOICE_POD -- npm run migrate
```

## Step 8: Configure Ingress/ALB

```bash
# Create Ingress resource
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway-ingress
  namespace: invoice-saas
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 80
EOF

# Wait for ALB to be provisioned
kubectl get ingress -n invoice-saas -w

# Get ALB URL
export ALB_URL=$(kubectl get ingress -n invoice-saas api-gateway-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "API Gateway URL: http://$ALB_URL"
```

## Step 9: Deploy Frontend to Render

### 9.1 Configure Render

1. Sign up at https://render.com
2. Connect GitHub repository
3. Create new Static Site
4. Configure:
   - **Build Command**: `cd frontend && pnpm install && pnpm build`
   - **Publish Directory**: `frontend/build`
   - **Environment Variables**:
     ```
     REACT_APP_API_URL=http://your-alb-url
     NODE_ENV=production
     ```

### 9.2 Deploy

- Render will automatically deploy on push to main branch
- Or trigger manual deploy from Render dashboard

## Step 10: Post-Deployment Verification

### 10.1 Health Checks

```bash
# Check API Gateway health
curl http://$ALB_URL/health

# Check all service health
for service in api-gateway invoice-service payment-service notification-service user-service; do
  kubectl exec -n invoice-saas deployment/$service -- curl -s http://localhost:3000/health || echo "$service health check failed"
done
```

### 10.2 Smoke Tests

```bash
# Test user registration
curl -X POST http://$ALB_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Test login
TOKEN=$(curl -X POST http://$ALB_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }' | jq -r '.token')

# Test invoice creation
curl -X POST http://$ALB_URL/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "clientName": "Acme Corp",
    "clientEmail": "billing@acme.com",
    "amount": 1000.00,
    "dueDate": "2024-12-31"
  }'
```

### 10.3 Monitoring Setup

```bash
# Access CloudWatch dashboard
aws cloudwatch get-dashboard --dashboard-name invoice-saas-prod-dashboard

# View logs
aws logs tail /aws/eks/invoice-saas-prod/application --follow
```

## Step 11: Run Automated Test Suite

```bash
# Run complete test suite with retry logic
pnpm run test:all

# Or use the test runner script directly
bash scripts/test-runner.sh
```

## Rollback Procedure

If deployment fails:

```bash
# Rollback Kubernetes deployments
kubectl rollout undo deployment/api-gateway -n invoice-saas
kubectl rollout undo deployment/invoice-service -n invoice-saas

# Rollback Terraform (if infrastructure changes were made)
cd infrastructure/terraform
terraform apply -target=module.eks -var-file="environments/prod/terraform.tfvars"
```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n invoice-saas
kubectl logs <pod-name> -n invoice-saas --previous
```

### Database connection issues
```bash
# Test from pod
kubectl exec -n invoice-saas <pod-name> -- nc -zv $RDS_HOST 5432
```

### ALB not provisioned
```bash
kubectl describe ingress -n invoice-saas
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
```

## Cost Monitoring

```bash
# View AWS Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "BlendedCost" "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```

## Maintenance

### Regular Tasks
- Weekly: Review CloudWatch alarms and logs
- Monthly: Review and optimize costs
- Monthly: Update dependencies and security patches
- Quarterly: Review and update resource sizing
- Quarterly: Disaster recovery drill

### Scaling Adjustments

```bash
# Scale EKS nodes manually if needed
aws eks update-nodegroup-config \
  --cluster-name invoice-saas-prod \
  --nodegroup-name invoice-saas-prod-node-group \
  --scaling-config minSize=5,maxSize=20,desiredSize=5

# Scale deployments
kubectl scale deployment/invoice-service -n invoice-saas --replicas=5
```

## Security Hardening

1. Enable AWS GuardDuty
2. Enable AWS Security Hub
3. Implement AWS WAF rules
4. Set up AWS Config rules
5. Enable VPC Flow Logs analysis
6. Implement pod security policies
7. Regular vulnerability scanning with Trivy
8. Rotate credentials quarterly

## Next Steps

1. Set up monitoring alerts (PagerDuty/Opsgenie)
2. Configure backup testing
3. Implement advanced logging (ELK/Datadog)
4. Set up performance monitoring (New Relic/Datadog)
5. Configure SSL certificates (ACM)
6. Implement advanced security (Falco, OPA)
7. Set up disaster recovery procedures
8. Configure multi-region failover (if needed)
