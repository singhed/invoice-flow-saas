export const config = {
  port: process.env.ANALYTICS_SERVICE_PORT || 3007,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/invoice_saas',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
  },
};
