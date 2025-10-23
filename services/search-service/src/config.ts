export const config = {
  port: process.env.SEARCH_SERVICE_PORT || 3008,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
  },
};
