import { Pool, PoolConfig, PoolClient } from 'pg';
import { logger } from '../logger';

interface DatabaseConfig {
  primary: PoolConfig;
  replicas?: PoolConfig[];
  fallbackRegions?: Array<{
    name: string;
    primary: PoolConfig;
    replicas?: PoolConfig[];
  }>;
  healthCheckInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface ConnectionHealth {
  region: string;
  type: 'primary' | 'replica';
  healthy: boolean;
  lastCheck: Date;
  responseTime?: number;
}

export class DatabaseConnectionManager {
  private primaryPool: Pool;
  private replicaPools: Pool[] = [];
  private fallbackPools: Map<string, { primary: Pool; replicas: Pool[] }> = new Map();
  private currentRegion: string = 'primary';
  private healthStatus: Map<string, ConnectionHealth> = new Map();
  private healthCheckTimer?: NodeJS.Timeout;
  private readonly config: DatabaseConfig;
  private replicaIndex = 0;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializeConnections();
    this.startHealthChecks();
  }

  private initializeConnections(): void {
    this.primaryPool = this.createPool(this.config.primary, 'primary-primary');
    
    if (this.config.replicas) {
      this.replicaPools = this.config.replicas.map((config, index) =>
        this.createPool(config, `primary-replica-${index}`)
      );
    }

    if (this.config.fallbackRegions) {
      this.config.fallbackRegions.forEach((region) => {
        const primaryPool = this.createPool(region.primary, `${region.name}-primary`);
        const replicaPools = region.replicas
          ? region.replicas.map((config, index) =>
              this.createPool(config, `${region.name}-replica-${index}`)
            )
          : [];

        this.fallbackPools.set(region.name, {
          primary: primaryPool,
          replicas: replicaPools,
        });
      });
    }

    logger.info('Database connection manager initialized', {
      primaryRegion: 'primary',
      fallbackRegions: Array.from(this.fallbackPools.keys()),
      replicaCount: this.replicaPools.length,
    });
  }

  private createPool(config: PoolConfig, identifier: string): Pool {
    const pool = new Pool({
      ...config,
      max: config.max || 20,
      min: config.min || 2,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
      statement_timeout: 30000,
      query_timeout: 30000,
    });

    pool.on('connect', () => {
      logger.debug('Database connection established', { pool: identifier });
    });

    pool.on('error', (err) => {
      logger.error('Database pool error', {
        pool: identifier,
        error: err.message,
      });
      this.handlePoolError(identifier);
    });

    pool.on('remove', () => {
      logger.debug('Database connection removed', { pool: identifier });
    });

    return pool;
  }

  private handlePoolError(identifier: string): void {
    logger.warn('Pool error detected, checking for failover', { pool: identifier });
    
    if (identifier.includes('primary-primary')) {
      this.attemptFailover();
    }
  }

  private async attemptFailover(): Promise<void> {
    logger.warn('Attempting database failover');

    for (const [regionName, pools] of this.fallbackPools) {
      const isHealthy = await this.checkPoolHealth(pools.primary);
      
      if (isHealthy) {
        logger.info('Failing over to region', { region: regionName });
        this.currentRegion = regionName;
        return;
      }
    }

    logger.error('All fallback regions unavailable');
  }

  private async checkPoolHealth(pool: Pool): Promise<boolean> {
    try {
      const start = Date.now();
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      const responseTime = Date.now() - start;
      
      return responseTime < 5000;
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
      return false;
    }
  }

  private startHealthChecks(): void {
    const interval = this.config.healthCheckInterval || 30000;

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, interval);

    logger.info('Health check started', { interval });
  }

  private async performHealthChecks(): Promise<void> {
    const checks: Promise<void>[] = [];

    checks.push(this.updateHealthStatus('primary-primary', this.primaryPool, 'primary'));

    this.replicaPools.forEach((pool, index) => {
      checks.push(
        this.updateHealthStatus(`primary-replica-${index}`, pool, 'replica')
      );
    });

    this.fallbackPools.forEach((pools, regionName) => {
      checks.push(
        this.updateHealthStatus(`${regionName}-primary`, pools.primary, 'primary')
      );
      pools.replicas.forEach((pool, index) => {
        checks.push(
          this.updateHealthStatus(`${regionName}-replica-${index}`, pool, 'replica')
        );
      });
    });

    await Promise.allSettled(checks);
  }

  private async updateHealthStatus(
    identifier: string,
    pool: Pool,
    type: 'primary' | 'replica'
  ): Promise<void> {
    const start = Date.now();
    const healthy = await this.checkPoolHealth(pool);
    const responseTime = Date.now() - start;

    this.healthStatus.set(identifier, {
      region: identifier,
      type,
      healthy,
      lastCheck: new Date(),
      responseTime,
    });

    if (!healthy) {
      logger.warn('Unhealthy database connection detected', {
        identifier,
        type,
      });
    }
  }

  async query(text: string, params?: any[], useReplica: boolean = false): Promise<any> {
    const pool = useReplica ? this.getReplicaPool() : this.getPrimaryPool();
    const maxRetries = this.config.maxRetries || 3;
    const retryDelay = this.config.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await pool.query(text, params);
        return result;
      } catch (error: any) {
        logger.error('Database query error', {
          attempt,
          error: error.message,
          useReplica,
        });

        if (attempt === maxRetries) {
          throw error;
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          await this.attemptFailover();
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error('Database query failed after all retries');
  }

  async getClient(useReplica: boolean = false): Promise<PoolClient> {
    const pool = useReplica ? this.getReplicaPool() : this.getPrimaryPool();
    return await pool.connect();
  }

  private getPrimaryPool(): Pool {
    if (this.currentRegion === 'primary') {
      return this.primaryPool;
    }

    const fallback = this.fallbackPools.get(this.currentRegion);
    return fallback?.primary || this.primaryPool;
  }

  private getReplicaPool(): Pool {
    let pools: Pool[];

    if (this.currentRegion === 'primary') {
      pools = this.replicaPools;
    } else {
      const fallback = this.fallbackPools.get(this.currentRegion);
      pools = fallback?.replicas || [];
    }

    if (pools.length === 0) {
      return this.getPrimaryPool();
    }

    this.replicaIndex = (this.replicaIndex + 1) % pools.length;
    return pools[this.replicaIndex];
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPrimaryPool().connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getHealthStatus(): ConnectionHealth[] {
    return Array.from(this.healthStatus.values());
  }

  getCurrentRegion(): string {
    return this.currentRegion;
  }

  async close(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    await this.primaryPool.end();

    for (const pool of this.replicaPools) {
      await pool.end();
    }

    for (const [, pools] of this.fallbackPools) {
      await pools.primary.end();
      for (const replicaPool of pools.replicas) {
        await replicaPool.end();
      }
    }

    logger.info('Database connection manager closed');
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    const retryDelay = this.config.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        logger.error('Operation failed', {
          attempt,
          error: error.message,
        });

        if (attempt === maxRetries) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error('Operation failed after all retries');
  }
}

export function createDatabaseConnectionManager(
  config: DatabaseConfig
): DatabaseConnectionManager {
  return new DatabaseConnectionManager(config);
}
