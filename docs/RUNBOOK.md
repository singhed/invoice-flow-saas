# Operations Runbook

Production operations guide for the Invoice SaaS platform.

## Table of Contents

- [System Overview](#system-overview)
- [Monitoring](#monitoring)
- [Incident Response](#incident-response)
- [Common Issues](#common-issues)
- [Maintenance Procedures](#maintenance-procedures)
- [Disaster Recovery](#disaster-recovery)

## System Overview

**Architecture Components**
- Frontend: React SPA hosted on Render
- API Gateway: EKS cluster in us-east-1
- Services: Microservices on EKS
- Database: RDS PostgreSQL Multi-AZ
- Cache: ElastiCache Redis Cluster
- Storage: S3 with CloudFront
- Queue: SQS with DLQ

**Dependencies**
- Stripe: Payment processing
- AWS SES: Email delivery
- AWS CloudWatch: Monitoring and logs

## Monitoring

**Key Metrics**

System Health:
```bash
# Check cluster status
kubectl get nodes
kubectl get pods -A --field-selector=status.phase!=Running

# Check service health
curl https://api.invoice-saas.com/health
```

Application Metrics:
- Response time p95 < 500ms
- Error rate < 0.1%
- Throughput: 1000 req/s sustained
- Database connections < 80% pool size

**Dashboards**
- CloudWatch: System metrics and logs
- Prometheus: Application metrics
- Grafana: Custom dashboards

**Alerts**

Critical:
- Service down > 2 minutes
- Error rate > 1%
- Database CPU > 80%
- Disk space > 85%

Warning:
- Response time p95 > 1s
- Memory usage > 80%
- Failed jobs > 10/minute

## Incident Response

**Severity Levels**

**SEV-1: Critical**
- Complete service outage
- Data loss or corruption
- Security breach
- Response time: Immediate
- On-call: All engineers

**SEV-2: High**
- Major feature unavailable
- Significant performance degradation
- Response time: 15 minutes
- On-call: Platform team

**SEV-3: Medium**
- Minor feature issues
- Non-critical bugs
- Response time: 4 hours
- On-call: Next business day

**Incident Response Procedure**

1. **Detection**
   ```bash
   # Check alert
   aws cloudwatch describe-alarms --state-value ALARM
   
   # Verify impact
   kubectl get pods -A
   curl https://api.invoice-saas.com/health
   ```

2. **Communication**
   - Create incident channel: `#incident-YYYYMMDD-NNN`
   - Post status: status.invoice-saas.com
   - Notify stakeholders

3. **Investigation**
   ```bash
   # Check recent deployments
   kubectl rollout history deployment/api-gateway -n invoice-saas
   
   # Review logs
   kubectl logs -f deployment/api-gateway -n invoice-saas --tail=100
   
   # Check metrics
   aws cloudwatch get-metric-statistics --namespace AWS/RDS \
     --metric-name CPUUtilization --statistics Average
   ```

4. **Mitigation**
   ```bash
   # Rollback if needed
   kubectl rollout undo deployment/api-gateway -n invoice-saas
   
   # Scale up if capacity issue
   kubectl scale deployment/api-gateway --replicas=10 -n invoice-saas
   
   # Restart service
   kubectl rollout restart deployment/api-gateway -n invoice-saas
   ```

5. **Resolution**
   - Verify metrics return to normal
   - Update status page
   - Schedule post-mortem

6. **Post-Mortem**
   - Timeline of events
   - Root cause analysis
   - Action items
   - Prevention measures

## Common Issues

### High API Latency

**Symptoms**
- Response time p95 > 1s
- Increased timeout errors

**Diagnosis**
```bash
# Check pod resources
kubectl top pods -n invoice-saas

# Check database performance
aws rds describe-db-instances --db-instance-identifier invoice-prod
```

**Resolution**
```bash
# Scale horizontally
kubectl scale deployment/api-gateway --replicas=5 -n invoice-saas

# Check slow queries
# Connect to RDS and run
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Database Connection Pool Exhaustion

**Symptoms**
- "Too many connections" errors
- Connection timeouts

**Diagnosis**
```bash
# Check active connections
psql -h $DB_HOST -c "SELECT count(*) FROM pg_stat_activity;"
```

**Resolution**
```bash
# Restart services to release connections
kubectl rollout restart deployment/invoice-service -n invoice-saas

# Increase pool size (temporary)
# Update environment variable MAX_POOL_SIZE
```

### Redis Cache Miss Rate High

**Symptoms**
- Increased database load
- Slower response times

**Diagnosis**
```bash
# Check cache hit rate
redis-cli INFO stats | grep hit
```

**Resolution**
```bash
# Warm up cache
curl https://api.invoice-saas.com/internal/cache/warmup

# Increase TTL if appropriate
# Update cache configuration
```

### Queue Backlog

**Symptoms**
- SQS messages increasing
- Delayed notifications

**Diagnosis**
```bash
# Check queue depth
aws sqs get-queue-attributes \
  --queue-url $QUEUE_URL \
  --attribute-names ApproximateNumberOfMessages
```

**Resolution**
```bash
# Scale worker service
kubectl scale deployment/worker-service --replicas=10 -n invoice-saas

# Check for failing jobs
aws sqs get-queue-attributes \
  --queue-url $DLQ_URL \
  --attribute-names ApproximateNumberOfMessages
```

## Maintenance Procedures

### Database Maintenance

**Backup Verification**
```bash
# Check recent backups
aws rds describe-db-snapshots \
  --db-instance-identifier invoice-prod \
  --max-records 5
```

**Index Maintenance**
```sql
-- Reindex if bloated
REINDEX TABLE invoices;

-- Analyze for query planning
ANALYZE;
```

### Certificate Renewal

```bash
# Check certificate expiry
echo | openssl s_client -servername api.invoice-saas.com \
  -connect api.invoice-saas.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Renew via cert-manager (automated)
kubectl get certificates -n invoice-saas
```

### Log Rotation

```bash
# Check log volume
aws logs describe-log-groups --log-group-name-prefix /aws/eks/invoice-saas

# Archive old logs
aws logs create-export-task \
  --log-group-name /aws/eks/invoice-saas/api-gateway \
  --from $(date -d '90 days ago' +%s000) \
  --to $(date -d '60 days ago' +%s000) \
  --destination invoice-saas-logs-archive
```

## Disaster Recovery

### RTO and RPO

- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 15 minutes

### Backup Strategy

**Database**
- Automated snapshots: Every 6 hours
- Retention: 30 days
- Cross-region replication: us-west-2

**Application State**
- Configuration: Version controlled in Git
- Secrets: AWS Secrets Manager with replication

### Recovery Procedures

**Database Recovery**
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier invoice-prod-restore \
  --db-snapshot-identifier invoice-prod-snapshot-20241027

# Promote read replica (faster)
aws rds promote-read-replica \
  --db-instance-identifier invoice-prod-replica
```

**Service Recovery**
```bash
# Redeploy from last known good
kubectl apply -k infrastructure/kubernetes/overlays/prod

# Verify health
kubectl get pods -n invoice-saas
```

**Cross-Region Failover**
```bash
# Update DNS to point to DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch file://failover.json

# Promote DR database
aws rds promote-read-replica \
  --db-instance-identifier invoice-dr-replica
```

## On-Call Rotation

**Schedule**
- Primary: Week rotation
- Secondary: Week rotation
- Escalation: Engineering manager

**Responsibilities**
- Monitor alerts
- Respond to incidents
- Update runbook
- Participate in post-mortems

**Handoff Procedure**
1. Review open incidents
2. Check system health
3. Review upcoming maintenance
4. Transfer on-call phone

## Escalation Paths

```
User Report → Support → On-Call Engineer
                        ↓
                   Platform Team Lead
                        ↓
                  Engineering Manager
                        ↓
                        CTO
```

## Resources

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Architecture](ARCHITECTURE.md)
- [Security](../SECURITY.md)
- Status Page: https://status.invoice-saas.com
- PagerDuty: https://invoice-saas.pagerduty.com
