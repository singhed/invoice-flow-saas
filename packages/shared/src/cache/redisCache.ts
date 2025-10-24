import Redis, { RedisOptions, Cluster, ClusterOptions } from 'ioredis';
import { logger } from '../logger';

interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  cluster?: boolean;
  clusterNodes?: Array<{ host: string; port: number }>;
  sentinels?: Array<{ host: string; port: number }>;
  sentinelName?: string;
  db?: number;
  keyPrefix?: string;
  retryStrategy?: (times: number) => number | void;
  maxRetriesPerRequest?: number;
}

interface CacheOptions {
  ttl?: number;
  namespace?: string;
  serialize?: boolean;
}

export class RedisCache {
  private client: Redis | Cluster;
  private defaultTTL: number;
  private keyPrefix: string;

  constructor(config: CacheConfig) {
    this.defaultTTL = 300;
    this.keyPrefix = config.keyPrefix || 'cache:';

    if (config.cluster && config.clusterNodes) {
      this.client = this.createClusterClient(config);
    } else if (config.sentinels && config.sentinelName) {
      this.client = this.createSentinelClient(config);
    } else {
      this.client = this.createStandaloneClient(config);
    }

    this.setupEventHandlers();
  }

  private createStandaloneClient(config: CacheConfig): Redis {
    const options: RedisOptions = {
      host: config.host || 'localhost',
      port: config.port || 6379,
      password: config.password,
      db: config.db || 0,
      retryStrategy: config.retryStrategy || this.defaultRetryStrategy,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      lazyConnect: false,
    };

    return new Redis(options);
  }

  private createClusterClient(config: CacheConfig): Cluster {
    const clusterOptions: ClusterOptions = {
      redisOptions: {
        password: config.password,
        enableReadyCheck: true,
      },
      clusterRetryStrategy: this.defaultRetryStrategy,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      scaleReads: 'slave',
    };

    return new Cluster(config.clusterNodes!, clusterOptions);
  }

  private createSentinelClient(config: CacheConfig): Redis {
    const options: RedisOptions = {
      sentinels: config.sentinels,
      name: config.sentinelName!,
      password: config.password,
      db: config.db || 0,
      retryStrategy: config.retryStrategy || this.defaultRetryStrategy,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    };

    return new Redis(options);
  }

  private defaultRetryStrategy(times: number): number {
    const delay = Math.min(times * 100, 3000);
    logger.warn('Redis connection retry', { attempt: times, delay });
    return delay;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    this.client.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });
  }

  private buildKey(key: string, namespace?: string): string {
    const ns = namespace ? `${namespace}:` : '';
    return `${this.keyPrefix}${ns}${key}`;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(key, options?.namespace);
      const value = await this.client.get(cacheKey);

      if (!value) {
        return null;
      }

      if (options?.serialize !== false) {
        return JSON.parse(value) as T;
      }

      return value as unknown as T;
    } catch (error: any) {
      logger.error('Redis GET error', { key, error: error.message });
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options?.namespace);
      const ttl = options?.ttl || this.defaultTTL;
      
      const serializedValue = options?.serialize !== false 
        ? JSON.stringify(value)
        : String(value);

      await this.client.setex(cacheKey, ttl, serializedValue);
      return true;
    } catch (error: any) {
      logger.error('Redis SET error', { key, error: error.message });
      return false;
    }
  }

  async mget<T>(keys: string[], options?: CacheOptions): Promise<Array<T | null>> {
    try {
      const cacheKeys = keys.map(key => this.buildKey(key, options?.namespace));
      const values = await this.client.mget(...cacheKeys);

      return values.map(value => {
        if (!value) return null;
        
        if (options?.serialize !== false) {
          try {
            return JSON.parse(value) as T;
          } catch {
            return null;
          }
        }
        
        return value as unknown as T;
      });
    } catch (error: any) {
      logger.error('Redis MGET error', { keys, error: error.message });
      return keys.map(() => null);
    }
  }

  async mset(entries: Array<{ key: string; value: any }>, options?: CacheOptions): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();
      const ttl = options?.ttl || this.defaultTTL;

      for (const entry of entries) {
        const cacheKey = this.buildKey(entry.key, options?.namespace);
        const serializedValue = options?.serialize !== false
          ? JSON.stringify(entry.value)
          : String(entry.value);
        
        pipeline.setex(cacheKey, ttl, serializedValue);
      }

      await pipeline.exec();
      return true;
    } catch (error: any) {
      logger.error('Redis MSET error', { error: error.message });
      return false;
    }
  }

  async del(key: string | string[], options?: CacheOptions): Promise<boolean> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      const cacheKeys = keys.map(k => this.buildKey(k, options?.namespace));
      
      await this.client.del(...cacheKeys);
      return true;
    } catch (error: any) {
      logger.error('Redis DEL error', { key, error: error.message });
      return false;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options?.namespace);
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch (error: any) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      return false;
    }
  }

  async expire(key: string, ttl: number, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options?.namespace);
      await this.client.expire(cacheKey, ttl);
      return true;
    } catch (error: any) {
      logger.error('Redis EXPIRE error', { key, error: error.message });
      return false;
    }
  }

  async ttl(key: string, options?: CacheOptions): Promise<number> {
    try {
      const cacheKey = this.buildKey(key, options?.namespace);
      return await this.client.ttl(cacheKey);
    } catch (error: any) {
      logger.error('Redis TTL error', { key, error: error.message });
      return -1;
    }
  }

  async incr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const cacheKey = this.buildKey(key, options?.namespace);
      return await this.client.incr(cacheKey);
    } catch (error: any) {
      logger.error('Redis INCR error', { key, error: error.message });
      return 0;
    }
  }

  async decr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const cacheKey = this.buildKey(key, options?.namespace);
      return await this.client.decr(cacheKey);
    } catch (error: any) {
      logger.error('Redis DECR error', { key, error: error.message });
      return 0;
    }
  }

  async keys(pattern: string, options?: CacheOptions): Promise<string[]> {
    try {
      const cachePattern = this.buildKey(pattern, options?.namespace);
      return await this.client.keys(cachePattern);
    } catch (error: any) {
      logger.error('Redis KEYS error', { pattern, error: error.message });
      return [];
    }
  }

  async deletePattern(pattern: string, options?: CacheOptions): Promise<boolean> {
    try {
      const keys = await this.keys(pattern, options);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error: any) {
      logger.error('Redis DELETE PATTERN error', { pattern, error: error.message });
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    
    return value;
  }

  async wrap<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions & { refreshThreshold?: number }
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      if (options?.refreshThreshold) {
        const ttl = await this.ttl(key, options);
        if (ttl > 0 && ttl < options.refreshThreshold) {
          factory().then(value => this.set(key, value, options)).catch(err => {
            logger.error('Background cache refresh failed', { key, error: err.message });
          });
        }
      }
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    
    return value;
  }

  async invalidateByTags(tags: string[]): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();
      
      for (const tag of tags) {
        const pattern = this.buildKey(`*:tag:${tag}:*`);
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          pipeline.del(...keys);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error: any) {
      logger.error('Redis INVALIDATE BY TAGS error', { tags, error: error.message });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis client disconnected');
    } catch (error: any) {
      logger.error('Redis disconnect error', { error: error.message });
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error: any) {
      logger.error('Redis PING error', { error: error.message });
      return false;
    }
  }

  getClient(): Redis | Cluster {
    return this.client;
  }
}

export function createRedisCache(config: CacheConfig): RedisCache {
  return new RedisCache(config);
}
