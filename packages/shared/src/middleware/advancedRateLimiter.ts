import { Request, Response, NextFunction } from 'express';
import { createRedisCache } from '../cache/redisCache';
import { logger } from '../logger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  burstCapacity: number;
  tierLimits?: {
    [tier: string]: {
      requestsPerMinute: number;
      requestsPerHour: number;
      burstCapacity: number;
    };
  };
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export class AdvancedRateLimiter {
  private cache: ReturnType<typeof createRedisCache>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cache = createRedisCache({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'ratelimit:',
    });
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const identifier = this.getIdentifier(req);
        const tier = this.getUserTier(req);
        const limits = this.getTierLimits(tier);

        const allowed = await this.checkRateLimit(identifier, limits);

        res.setHeader('X-RateLimit-Limit', allowed.limit.toString());
        res.setHeader('X-RateLimit-Remaining', allowed.remaining.toString());
        res.setHeader('X-RateLimit-Reset', allowed.reset.toISOString());

        if (allowed.remaining < 0) {
          res.setHeader('Retry-After', allowed.retryAfter?.toString() || '60');
          
          logger.warn('Rate limit exceeded', {
            identifier,
            tier,
            path: req.path,
          });

          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: allowed.retryAfter,
            limit: allowed.limit,
            reset: allowed.reset,
          });
        }

        next();
      } catch (error: any) {
        logger.error('Rate limiter error', { error: error.message });
        next();
      }
    };
  }

  private getIdentifier(req: Request): string {
    const userId = (req as any).user?.id;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const apiKey = req.headers['x-api-key'] as string;

    if (userId) return `user:${userId}`;
    if (apiKey) return `api:${apiKey}`;
    return `ip:${ip}`;
  }

  private getUserTier(req: Request): string {
    const user = (req as any).user;
    return user?.tier || 'free';
  }

  private getTierLimits(tier: string) {
    if (this.config.tierLimits && this.config.tierLimits[tier]) {
      return this.config.tierLimits[tier];
    }

    return {
      requestsPerMinute: Math.floor(this.config.maxRequests / (this.config.windowMs / 60000)),
      requestsPerHour: this.config.maxRequests,
      burstCapacity: this.config.burstCapacity,
    };
  }

  private async checkRateLimit(
    identifier: string,
    limits: { requestsPerMinute: number; requestsPerHour: number; burstCapacity: number }
  ): Promise<RateLimitInfo> {
    const now = Date.now();
    const minuteWindow = Math.floor(now / 60000);
    const hourWindow = Math.floor(now / 3600000);

    const minuteKey = `${identifier}:${minuteWindow}`;
    const hourKey = `${identifier}:h:${hourWindow}`;
    const burstKey = `${identifier}:burst`;

    const [minuteCount, hourCount, burstCount] = await Promise.all([
      this.incrementCounter(minuteKey, 60),
      this.incrementCounter(hourKey, 3600),
      this.incrementCounter(burstKey, 10),
    ]);

    const minuteRemaining = limits.requestsPerMinute - minuteCount;
    const hourRemaining = limits.requestsPerHour - hourCount;
    const burstRemaining = limits.burstCapacity - burstCount;

    const remaining = Math.min(minuteRemaining, hourRemaining, burstRemaining);
    const limit = Math.min(
      limits.requestsPerMinute,
      limits.requestsPerHour,
      limits.burstCapacity
    );

    let retryAfter: number | undefined;
    if (remaining < 0) {
      if (minuteRemaining < 0) {
        retryAfter = 60 - (Math.floor(now / 1000) % 60);
      } else if (burstRemaining < 0) {
        retryAfter = 10;
      } else {
        retryAfter = 3600 - (Math.floor(now / 1000) % 3600);
      }
    }

    const resetTime = new Date(
      minuteRemaining < 0
        ? (minuteWindow + 1) * 60000
        : (hourWindow + 1) * 3600000
    );

    return {
      limit,
      remaining: Math.max(0, remaining),
      reset: resetTime,
      retryAfter,
    };
  }

  private async incrementCounter(key: string, ttl: number): Promise<number> {
    const count = await this.cache.incr(key);
    
    if (count === 1) {
      await this.cache.expire(key, ttl);
    }

    return count;
  }

  async clearLimits(identifier: string): Promise<void> {
    await this.cache.deletePattern(`${identifier}:*`);
  }

  async getRateLimitStatus(identifier: string): Promise<{
    minute: number;
    hour: number;
    burst: number;
  }> {
    const now = Date.now();
    const minuteWindow = Math.floor(now / 60000);
    const hourWindow = Math.floor(now / 3600000);

    const minuteKey = `${identifier}:${minuteWindow}`;
    const hourKey = `${identifier}:h:${hourWindow}`;
    const burstKey = `${identifier}:burst`;

    const [minute, hour, burst] = await Promise.all([
      this.cache.get<string>(minuteKey),
      this.cache.get<string>(hourKey),
      this.cache.get<string>(burstKey),
    ]);

    return {
      minute: parseInt(minute || '0', 10),
      hour: parseInt(hour || '0', 10),
      burst: parseInt(burst || '0', 10),
    };
  }
}

export function createAdvancedRateLimiter(config: RateLimitConfig): AdvancedRateLimiter {
  return new AdvancedRateLimiter(config);
}

export const defaultTierLimits = {
  free: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    burstCapacity: 100,
  },
  basic: {
    requestsPerMinute: 300,
    requestsPerHour: 10000,
    burstCapacity: 500,
  },
  premium: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    burstCapacity: 2000,
  },
  enterprise: {
    requestsPerMinute: 5000,
    requestsPerHour: 500000,
    burstCapacity: 10000,
  },
};
