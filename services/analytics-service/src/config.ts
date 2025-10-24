export const config = {
  port: process.env.ANALYTICS_SERVICE_PORT || 3007,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    cluster: process.env.REDIS_CLUSTER === 'true',
    clusterNodes: process.env.REDIS_CLUSTER_NODES
      ? JSON.parse(process.env.REDIS_CLUSTER_NODES)
      : undefined,
    sentinels: process.env.REDIS_SENTINELS
      ? JSON.parse(process.env.REDIS_SENTINELS)
      : undefined,
    sentinelName: process.env.REDIS_SENTINEL_NAME,
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/invoice_saas',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
  },
};
