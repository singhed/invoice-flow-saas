import { Pool, PoolConfig, PoolClient } from 'pg';
import { logger } from '../logger';

interface PoolOptimizerConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  statementTimeout: number;
  queryTimeout: number;
  allowExitOnIdle: boolean;
  maxUses: number;
}

interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingClients: number;
  poolSize: number;
  connectionErrors: number;
  queryErrors: number;
  averageQueryTime: number;
  slowQueries: number;
}

export class ConnectionPoolOptimizer {
  private pool: Pool;
  private config: PoolOptimizerConfig;
  private metrics: PoolMetrics;
  private queryTimes: number[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000;
  private readonly MAX_QUERY_TIMES = 1000;
  private metricsInterval?: NodeJS.Timeout;

  constructor(poolConfig: PoolConfig, optimizerConfig?: Partial<PoolOptimizerConfig>) {
    this.config = {
      min: optimizerConfig?.min || 10,
      max: optimizerConfig?.max || 100,
      idleTimeoutMillis: optimizerConfig?.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: optimizerConfig?.connectionTimeoutMillis || 5000,
      statementTimeout: optimizerConfig?.statementTimeout || 30000,
      queryTimeout: optimizerConfig?.queryTimeout || 30000,
      allowExitOnIdle: optimizerConfig?.allowExitOnIdle || true,
      maxUses: optimizerConfig?.maxUses || 7500,
    };

    this.metrics = {
      totalConnections: 0,
      idleConnections: 0,
      activeConnections: 0,
      waitingClients: 0,
      poolSize: 0,
      connectionErrors: 0,
      queryErrors: 0,
      averageQueryTime: 0,
      slowQueries: 0,
    };

    this.pool = new Pool({
      ...poolConfig,
      min: this.config.min,
      max: this.config.max,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      statement_timeout: this.config.statementTimeout,
      query_timeout: this.config.queryTimeout,
      allowExitOnIdle: this.config.allowExitOnIdle,
      maxUses: this.config.maxUses,
    });

    this.setupEventHandlers();
    this.startMetricsCollection();
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client) => {
      this.metrics.totalConnections++;
      logger.debug('Database connection established', {
        totalConnections: this.metrics.totalConnections,
      });

      client.on('error', (err) => {
        this.metrics.connectionErrors++;
        logger.error('Database client error', { error: err.message });
      });
    });

    this.pool.on('acquire', () => {
      this.metrics.idleConnections--;
      this.metrics.activeConnections++;
    });

    this.pool.on('release', () => {
      this.metrics.activeConnections--;
      this.metrics.idleConnections++;
    });

    this.pool.on('remove', () => {
      this.metrics.totalConnections--;
      logger.debug('Database connection removed', {
        totalConnections: this.metrics.totalConnections,
      });
    });

    this.pool.on('error', (err) => {
      this.metrics.connectionErrors++;
      logger.error('Database pool error', { error: err.message });
    });
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.metrics.poolSize = this.pool.totalCount;
      this.metrics.idleConnections = this.pool.idleCount;
      this.metrics.waitingClients = this.pool.waitingCount;
      
      this.logPoolMetrics();
      this.adjustPoolSize();
    }, 60000);
  }

  private adjustPoolSize(): void {
    const utilization = this.metrics.activeConnections / this.config.max;
    
    if (utilization > 0.9 && this.config.max < 200) {
      const newMax = Math.min(this.config.max + 20, 200);
      logger.info('Increasing pool size', {
        currentMax: this.config.max,
        newMax,
        utilization: (utilization * 100).toFixed(2) + '%',
      });
      this.config.max = newMax;
    } else if (utilization < 0.3 && this.config.max > 50) {
      const newMax = Math.max(this.config.max - 10, 50);
      logger.info('Decreasing pool size', {
        currentMax: this.config.max,
        newMax,
        utilization: (utilization * 100).toFixed(2) + '%',
      });
      this.config.max = newMax;
    }
  }

  private logPoolMetrics(): void {
    logger.info('Database pool metrics', {
      totalConnections: this.metrics.totalConnections,
      idleConnections: this.metrics.idleConnections,
      activeConnections: this.metrics.activeConnections,
      waitingClients: this.metrics.waitingClients,
      poolSize: this.metrics.poolSize,
      utilization: ((this.metrics.activeConnections / this.config.max) * 100).toFixed(2) + '%',
      averageQueryTime: this.metrics.averageQueryTime.toFixed(2) + 'ms',
      slowQueries: this.metrics.slowQueries,
      connectionErrors: this.metrics.connectionErrors,
      queryErrors: this.metrics.queryErrors,
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await this.pool.query(text, params);
      
      const queryTime = Date.now() - startTime;
      this.recordQueryTime(queryTime);

      if (queryTime > this.SLOW_QUERY_THRESHOLD) {
        this.metrics.slowQueries++;
        logger.warn('Slow query detected', {
          query: text.substring(0, 100),
          duration: queryTime,
          threshold: this.SLOW_QUERY_THRESHOLD,
        });
      }

      return result;
    } catch (error: any) {
      this.metrics.queryErrors++;
      logger.error('Query error', {
        error: error.message,
        query: text.substring(0, 100),
      });
      throw error;
    }
  }

  async connect(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error: any) {
      this.metrics.connectionErrors++;
      logger.error('Connection error', { error: error.message });
      throw error;
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.connect();

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

  private recordQueryTime(time: number): void {
    this.queryTimes.push(time);
    
    if (this.queryTimes.length > this.MAX_QUERY_TIMES) {
      this.queryTimes.shift();
    }

    const sum = this.queryTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageQueryTime = sum / this.queryTimes.length;
  }

  getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  getPoolInfo(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
      return false;
    }
  }

  async closeIdleConnections(): Promise<void> {
    logger.info('Closing idle connections');
    
    await this.pool.query(
      `SELECT pg_terminate_backend(pid) 
       FROM pg_stat_activity 
       WHERE state = 'idle' 
       AND state_change < NOW() - INTERVAL '5 minutes'
       AND pid <> pg_backend_pid()`
    );
  }

  async end(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    await this.pool.end();
    logger.info('Database pool closed');
  }
}

export function createConnectionPoolOptimizer(
  poolConfig: PoolConfig,
  optimizerConfig?: Partial<PoolOptimizerConfig>
): ConnectionPoolOptimizer {
  return new ConnectionPoolOptimizer(poolConfig, optimizerConfig);
}
