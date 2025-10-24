# Caching and High Availability Improvements

This document describes the improvements made to caching and database infrastructure for high availability and disaster recovery.

## Overview

The Invoice SaaS platform now includes:

1. **Advanced Redis Caching** - Improved caching with cluster support, sentinel configuration, and failover
2. **Multi-Region Database Replication** - PostgreSQL Aurora Global Database with automatic failover
3. **Connection Management** - Intelligent database connection pooling with automatic region failover
4. **High Availability Redis** - ElastiCache with cluster mode and automatic failover

---

## 1. Advanced Redis Caching

### Features

#### Multi-Mode Support
- **Standalone Mode**: Single Redis instance for development
- **Cluster Mode**: Sharded Redis cluster for production scale
- **Sentinel Mode**: High availability with automatic master failover

#### Caching Patterns
- **Cache-Aside (Lazy Loading)**: `getOrSet()` - Load data on cache miss
- **Write-Through**: Automatic cache refresh with `wrap()` method
- **Refresh-Ahead**: Background cache refresh before expiration
- **Cache Invalidation**: Pattern-based and tag-based invalidation

#### Advanced Operations
- Batch operations (mget, mset)
- Atomic operations (incr, decr)
- TTL management
- Pattern matching and bulk delete
- Health monitoring

### Implementation

```typescript
import { createRedisCache } from '@invoice-saas/shared';

// Standalone configuration
const cache = createRedisCache({
  host: 'localhost',
  port: 6379,
  password: 'your-password',
  keyPrefix: 'myapp:',
});

// Cluster configuration
const clusterCache = createRedisCache({
  cluster: true,
  clusterNodes: [
    { host: 'node1.redis.com', port: 6379 },
    { host: 'node2.redis.com', port: 6379 },
    { host: 'node3.redis.com', port: 6379 },
  ],
  password: 'your-password',
  keyPrefix: 'myapp:',
});

// Sentinel configuration
const sentinelCache = createRedisCache({
  sentinels: [
    { host: 'sentinel1.redis.com', port: 26379 },
    { host: 'sentinel2.redis.com', port: 26379 },
    { host: 'sentinel3.redis.com', port: 26379 },
  ],
  sentinelName: 'mymaster',
  password: 'your-password',
  keyPrefix: 'myapp:',
});
```

### Usage Examples

#### Cache-Aside Pattern

```typescript
// Simple get/set
const user = await cache.get<User>('user:123');
if (!user) {
  const userData = await fetchUserFromDB('123');
  await cache.set('user:123', userData, { ttl: 3600 });
}

// Or use getOrSet
const user = await cache.getOrSet('user:123', async () => {
  return await fetchUserFromDB('123');
}, { ttl: 3600 });
```

#### Write-Through with Background Refresh

```typescript
// Automatically refresh cache when TTL is low
const data = await cache.wrap('analytics:dashboard', async () => {
  return await generateDashboardData();
}, {
  ttl: 300,              // 5 minutes
  refreshThreshold: 60,  // Refresh in background when < 60s remaining
});
```

#### Batch Operations

```typescript
// Get multiple keys
const values = await cache.mget<User>([
  'user:123',
  'user:456',
  'user:789',
]);

// Set multiple keys
await cache.mset([
  { key: 'user:123', value: user1 },
  { key: 'user:456', value: user2 },
], { ttl: 3600 });
```

#### Cache Invalidation

```typescript
// Delete single key
await cache.del('user:123');

// Delete multiple keys
await cache.del(['user:123', 'user:456']);

// Delete by pattern
await cache.deletePattern('user:*');

// Invalidate by tags
await cache.invalidateByTags(['users', 'analytics']);
```

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Cluster Mode
REDIS_CLUSTER=true
REDIS_CLUSTER_NODES='[{"host":"node1","port":6379},{"host":"node2","port":6379}]'

# Sentinel Mode
REDIS_SENTINELS='[{"host":"sentinel1","port":26379},{"host":"sentinel2","port":26379}]'
REDIS_SENTINEL_NAME=mymaster

# Cache Settings
CACHE_TTL=300  # Default TTL in seconds
```

---

## 2. Multi-Region Database Replication

### Architecture

```
Primary Region (us-east-1)
├── Aurora PostgreSQL Cluster
│   ├── Writer Instance (1x)
│   └── Reader Instances (2x)
└── Automatic Backups (35 days)

Secondary Region (us-west-2)
├── Global Database Replica
│   └── Reader Instances (2x)
└── Automatic Replication from Primary

Failover Capabilities:
- Cross-region replication lag: < 1 second
- RPO (Recovery Point Objective): < 1 second
- RTO (Recovery Time Objective): < 1 minute
```

### Features

#### Global Database
- **Cross-Region Replication**: Automatic, asynchronous replication
- **Low Latency**: Typically < 1 second replication lag
- **Disaster Recovery**: Promote secondary region to primary in < 1 minute
- **Read Scaling**: Read from local region for reduced latency

#### High Availability
- **Multi-AZ Deployment**: Automatic failover within region
- **Automated Backups**: 35-day retention with point-in-time recovery
- **Automated Patching**: Zero-downtime maintenance windows
- **Storage Auto-Scaling**: Automatic storage growth from 10GB to 128TB

#### Security
- **Encryption at Rest**: KMS encryption with automatic key rotation
- **Encryption in Transit**: TLS 1.2+ for all connections
- **VPC Isolation**: Database in private subnets
- **IAM Authentication**: Optional IAM database authentication

### Terraform Configuration

The multi-region RDS setup is managed via Terraform in:
```
infrastructure/terraform/modules/multi-region-rds/main.tf
```

#### Deployment

```bash
cd infrastructure/terraform

# Configure AWS providers
cat > providers.tf <<EOF
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}
EOF

# Initialize and deploy
terraform init
terraform plan -var-file="environments/prod/terraform.tfvars"
terraform apply
```

### Connection Management

The database connection manager provides:

#### Automatic Failover
- Health check monitoring every 30 seconds
- Automatic detection of primary region failures
- Seamless failover to secondary region
- Connection pooling for optimal performance

#### Read Replica Load Balancing
- Round-robin distribution to read replicas
- Automatic fallback to primary if no replicas available
- Separate pools for reads and writes

#### Implementation

```typescript
import { createDatabaseConnectionManager } from '@invoice-saas/shared';

const db = createDatabaseConnectionManager({
  primary: {
    host: process.env.DB_PRIMARY_HOST,
    port: 5432,
    database: 'invoice_saas',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,  // Connection pool size
  },
  replicas: [
    {
      host: process.env.DB_REPLICA_1_HOST,
      port: 5432,
      database: 'invoice_saas',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
    },
    {
      host: process.env.DB_REPLICA_2_HOST,
      port: 5432,
      database: 'invoice_saas',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
    },
  ],
  fallbackRegions: [
    {
      name: 'us-west-2',
      primary: {
        host: process.env.DB_SECONDARY_HOST,
        port: 5432,
        database: 'invoice_saas',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 20,
      },
      replicas: [
        {
          host: process.env.DB_SECONDARY_REPLICA_1_HOST,
          port: 5432,
          database: 'invoice_saas',
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          max: 20,
        },
      ],
    },
  ],
  healthCheckInterval: 30000,  // 30 seconds
  maxRetries: 3,
  retryDelay: 1000,
});
```

### Usage Examples

#### Basic Queries

```typescript
// Write query (uses primary)
await db.query('INSERT INTO invoices (id, amount) VALUES ($1, $2)', ['inv_123', 1000]);

// Read query (uses replica)
const result = await db.query('SELECT * FROM invoices WHERE id = $1', ['inv_123'], true);
```

#### Transactions

```typescript
const result = await db.transaction(async (client) => {
  await client.query('INSERT INTO invoices (id, amount) VALUES ($1, $2)', ['inv_123', 1000]);
  await client.query('INSERT INTO audit_log (action) VALUES ($1)', ['invoice_created']);
  return { success: true };
});
```

#### Health Monitoring

```typescript
// Get health status of all connections
const healthStatus = db.getHealthStatus();
console.log(healthStatus);
// [
//   { region: 'primary-primary', type: 'primary', healthy: true, lastCheck: Date, responseTime: 50 },
//   { region: 'primary-replica-0', type: 'replica', healthy: true, lastCheck: Date, responseTime: 45 },
//   ...
// ]

// Get current active region
const currentRegion = db.getCurrentRegion();
console.log(currentRegion); // 'primary' or 'us-west-2'
```

---

## 3. Redis High Availability Setup (AWS ElastiCache)

### Features

#### Cluster Mode Disabled (Replication Group)
- 1 Primary + 2 Read Replicas
- Automatic failover within 60 seconds
- Multi-AZ deployment
- Read scaling across replicas

#### Cluster Mode Enabled (Sharded)
- 3 Shards (Node Groups)
- 2 Replicas per shard
- Horizontal scaling capability
- Automatic slot rebalancing

#### Security
- At-rest encryption (AES-256)
- In-transit encryption (TLS)
- Auth tokens for authentication
- VPC isolation

#### Monitoring
- CloudWatch metrics and logs
- Slow query logging
- Engine logs
- SNS notifications for alerts

### Terraform Configuration

Located at:
```
infrastructure/terraform/modules/redis-cluster/main.tf
```

### Deployment

```bash
cd infrastructure/terraform

# Deploy Redis cluster
terraform apply -target=module.redis_cluster
```

### Connection

```typescript
// Using cluster configuration endpoint
const cache = createRedisCache({
  cluster: true,
  clusterNodes: [
    { host: process.env.REDIS_CONFIG_ENDPOINT, port: 6379 },
  ],
  password: process.env.REDIS_AUTH_TOKEN,
  keyPrefix: 'myapp:',
});
```

---

## 4. Performance Optimizations

### Caching Strategy

#### Cache Layers
1. **Application Cache**: Redis (< 10ms latency)
2. **Database Query Cache**: PostgreSQL query cache
3. **CDN Cache**: CloudFront for static assets

#### TTL Guidelines
- User sessions: 1-24 hours
- Static data: 1-7 days
- Analytics: 5-30 minutes
- Search results: 5-15 minutes
- API responses: 1-5 minutes

### Database Optimizations

#### Connection Pooling
- Min connections: 2 per pool
- Max connections: 20 per pool
- Idle timeout: 30 seconds
- Connection timeout: 5 seconds

#### Query Optimization
- Prepared statements for all queries
- Query timeout: 30 seconds
- Statement timeout: 30 seconds
- Automatic query plan caching

---

## 5. Monitoring and Alerting

### Metrics to Monitor

#### Redis Metrics
- CPU Utilization (< 75%)
- Memory Usage (< 80%)
- Cache Hit Rate (> 90%)
- Evictions (< 1000/hour)
- Replication Lag (< 1 second)

#### Database Metrics
- CPU Utilization (< 75%)
- Connection Count (< 80% of max)
- Replication Lag (< 1 second)
- Query Duration (p99 < 100ms)
- Transaction Deadlocks (< 10/hour)

### CloudWatch Alarms

Alarms are automatically configured for:
- High CPU usage
- High memory usage
- Connection count approaching limits
- Replication lag > 5 seconds
- Failed health checks

---

## 6. Disaster Recovery Procedures

### Database Failover

#### Automatic Failover (Within Region)
1. Aurora detects primary failure
2. Promotes read replica to primary (< 30 seconds)
3. DNS updates automatically
4. Applications reconnect automatically

#### Manual Cross-Region Failover
```bash
# 1. Promote secondary region cluster
aws rds promote-read-replica-db-cluster \
  --db-cluster-identifier prod-invoice-saas-secondary \
  --region us-west-2

# 2. Update application environment variables
export DB_PRIMARY_HOST=new-primary-endpoint

# 3. Restart services
kubectl rollout restart deployment -n invoice-saas
```

### Redis Failover

#### Automatic Failover
1. ElastiCache detects primary failure
2. Promotes replica to primary (< 60 seconds)
3. DNS updates automatically
4. Applications reconnect automatically

### Backup and Restore

#### Database Backup
```bash
# Manual snapshot
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier prod-invoice-saas-primary \
  --db-cluster-snapshot-identifier manual-backup-2024-01-01

# Restore from snapshot
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier prod-invoice-saas-restored \
  --snapshot-identifier manual-backup-2024-01-01
```

#### Redis Backup
- Automatic daily snapshots
- 7-day retention
- Manual snapshots on demand

---

## 7. Cost Optimization

### Database Costs

#### Production (us-east-1)
- Writer: db.r6g.large (~$146/month)
- Readers (2x): db.r6g.large (~$292/month)
- Storage: $0.10/GB-month
- Backups: Free (within retention)

#### DR (us-west-2)
- Readers (2x): db.r6g.large (~$292/month)
- Cross-region replication: Included

**Total Database**: ~$730/month

### Redis Costs

#### Production
- Standard (3 nodes): cache.r6g.large (~$328/month)
- Cluster (9 nodes): cache.r6g.large (~$984/month)

#### Cost Savings
- Reserved Instances: 30-60% savings
- Savings Plans: 20-40% savings
- Right-sizing: Monitor and adjust instance types

---

## 8. Testing

### Cache Testing

```typescript
// Test cache operations
const testCache = async () => {
  // Set and get
  await cache.set('test:key', { value: 'test' }, { ttl: 60 });
  const value = await cache.get('test:key');
  console.assert(value?.value === 'test');

  // Batch operations
  await cache.mset([
    { key: 'test:1', value: 'a' },
    { key: 'test:2', value: 'b' },
  ]);
  const values = await cache.mget(['test:1', 'test:2']);
  console.assert(values.length === 2);

  // Pattern delete
  await cache.deletePattern('test:*');
};
```

### Database Failover Testing

```bash
# Simulate primary failure
aws rds failover-db-cluster \
  --db-cluster-identifier prod-invoice-saas-primary

# Monitor application logs
kubectl logs -f deployment/api-gateway -n invoice-saas

# Check connection manager status
curl http://localhost:3000/health/database
```

---

## 9. Best Practices

### Caching
1. Always set appropriate TTLs
2. Use cache namespaces to organize keys
3. Implement cache warming for critical data
4. Monitor cache hit rates and adjust strategy
5. Use batch operations when possible
6. Implement graceful degradation on cache failures

### Database
1. Always use connection pooling
2. Separate read and write queries
3. Use transactions for data consistency
4. Implement query timeouts
5. Monitor slow queries and optimize
6. Regular backup testing and restoration drills

### High Availability
1. Test failover procedures regularly
2. Monitor replication lag continuously
3. Have runbooks for common failures
4. Implement circuit breakers for cascading failures
5. Use health checks for all services
6. Maintain separate monitoring in each region

---

## 10. Troubleshooting

### High Cache Memory Usage

```bash
# Check memory usage
redis-cli INFO memory

# Find large keys
redis-cli --bigkeys

# Set max memory policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Database Connection Exhaustion

```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < NOW() - INTERVAL '5 minutes';
```

### Replication Lag

```bash
# Check replication lag
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;

# Check replication status
SELECT * FROM pg_stat_replication;
```

---

## Summary

The Invoice SaaS platform now includes enterprise-grade caching and database infrastructure:

✅ **Advanced Redis caching** with multiple deployment modes
✅ **Multi-region database replication** for disaster recovery
✅ **Automatic failover** for both cache and database
✅ **Intelligent connection management** with health monitoring
✅ **Production-ready Terraform configurations**
✅ **Comprehensive monitoring and alerting**
✅ **Documented procedures** for operations and troubleshooting

**Availability Target**: 99.99% (< 53 minutes downtime/year)
**RPO (Recovery Point Objective)**: < 1 second
**RTO (Recovery Time Objective)**: < 1 minute
