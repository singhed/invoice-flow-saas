import { logger, createRedisCache } from '@invoice-saas/shared';
import { config } from '../config';

const cache = createRedisCache({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  keyPrefix: 'analytics:',
  cluster: config.redis.cluster || false,
  clusterNodes: config.redis.clusterNodes,
  sentinels: config.redis.sentinels,
  sentinelName: config.redis.sentinelName,
});

interface AnalyticsEvent {
  eventType: string;
  eventData: any;
  userId?: string;
  metadata?: any;
  timestamp: Date;
}

interface DashboardOverview {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  averageInvoiceValue: number;
  paymentRate: number;
}

interface RevenueTrend {
  period: string;
  revenue: number;
  invoiceCount: number;
}

interface InvoiceStatusBreakdown {
  status: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

interface TopCustomer {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  invoiceCount: number;
  averageInvoiceValue: number;
}

interface PaymentMetrics {
  onTimePayments: number;
  latePayments: number;
  averagePaymentTime: number;
  collectionRate: number;
}

class AnalyticsService {
  async getDashboardOverview(startDate: Date, endDate: Date): Promise<DashboardOverview> {
    const cacheKey = `overview:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    return await cache.getOrSet(cacheKey, async () => {
      const mockData: DashboardOverview = {
        totalRevenue: Math.floor(Math.random() * 500000) + 100000,
        totalInvoices: Math.floor(Math.random() * 500) + 100,
        paidInvoices: Math.floor(Math.random() * 300) + 50,
        pendingInvoices: Math.floor(Math.random() * 100) + 20,
        overdueInvoices: Math.floor(Math.random() * 50) + 5,
        averageInvoiceValue: Math.floor(Math.random() * 5000) + 1000,
        paymentRate: 0.75 + Math.random() * 0.2,
      };

      logger.info('Dashboard overview generated', { startDate, endDate });

      return mockData;
    }, { ttl: config.cache.ttl });
  }

  async getRevenueTrends(startDate: Date, endDate: Date, period: string): Promise<RevenueTrend[]> {
    const cacheKey = `trends:${period}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    return await cache.wrap(cacheKey, async () => {
      const trends: RevenueTrend[] = [];
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const points = period === 'day' ? Math.min(daysDiff, 30) : period === 'week' ? Math.min(Math.ceil(daysDiff / 7), 12) : 12;

      for (let i = 0; i < points; i++) {
        const baseRevenue = 10000 + Math.random() * 20000;
        trends.push({
          period: period === 'day' ? `Day ${i + 1}` : period === 'week' ? `Week ${i + 1}` : `Month ${i + 1}`,
          revenue: Math.floor(baseRevenue),
          invoiceCount: Math.floor(Math.random() * 50) + 10,
        });
      }

      logger.info('Revenue trends generated', { startDate, endDate, period });

      return trends;
    }, { ttl: config.cache.ttl, refreshThreshold: 60 });
  }

  async getInvoicesByStatus(startDate: Date, endDate: Date): Promise<InvoiceStatusBreakdown[]> {
    const cacheKey = `status:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    return await cache.getOrSet(cacheKey, async () => {
      const statuses = ['paid', 'pending', 'overdue', 'draft', 'cancelled'];
      const breakdown: InvoiceStatusBreakdown[] = statuses.map(status => {
        const count = Math.floor(Math.random() * 100) + 10;
        const totalAmount = Math.floor(Math.random() * 100000) + 10000;
        return {
          status,
          count,
          totalAmount,
          percentage: 0,
        };
      });

      const totalCount = breakdown.reduce((sum, item) => sum + item.count, 0);
      breakdown.forEach(item => {
        item.percentage = (item.count / totalCount) * 100;
      });

      logger.info('Invoice status breakdown generated', { startDate, endDate });

      return breakdown;
    }, { ttl: config.cache.ttl });
  }

  async getTopCustomers(startDate: Date, endDate: Date, limit: number): Promise<TopCustomer[]> {
    const cacheKey = `customers:${limit}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    return await cache.getOrSet(cacheKey, async () => {
      const customers: TopCustomer[] = [];
      for (let i = 0; i < limit; i++) {
        const invoiceCount = Math.floor(Math.random() * 50) + 5;
        const totalRevenue = Math.floor(Math.random() * 100000) + 5000;
        customers.push({
          customerId: `cust_${i + 1}`,
          customerName: `Customer ${i + 1}`,
          totalRevenue,
          invoiceCount,
          averageInvoiceValue: Math.floor(totalRevenue / invoiceCount),
        });
      }

      customers.sort((a, b) => b.totalRevenue - a.totalRevenue);

      logger.info('Top customers generated', { startDate, endDate, limit });

      return customers;
    }, { ttl: config.cache.ttl });
  }

  async getPaymentMetrics(startDate: Date, endDate: Date): Promise<PaymentMetrics> {
    const cacheKey = `payments:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    return await cache.getOrSet(cacheKey, async () => {
      const metrics: PaymentMetrics = {
        onTimePayments: Math.floor(Math.random() * 200) + 100,
        latePayments: Math.floor(Math.random() * 50) + 10,
        averagePaymentTime: Math.floor(Math.random() * 20) + 5,
        collectionRate: 0.8 + Math.random() * 0.15,
      };

      logger.info('Payment metrics generated', { startDate, endDate });

      return metrics;
    }, { ttl: config.cache.ttl });
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const eventKey = `event:${event.eventType}:${Date.now()}`;
    
    await cache.set(eventKey, event, { ttl: 86400 * 30 });

    logger.info('Event tracked', {
      eventType: event.eventType,
      userId: event.userId,
    });
  }

  async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      await cache.deletePattern(pattern);
      logger.info('Cache invalidated', { pattern });
    } else {
      await cache.deletePattern('*');
      logger.info('All analytics cache invalidated');
    }
  }

  async getCacheHealth(): Promise<boolean> {
    return await cache.ping();
  }
}

export const analyticsService = new AnalyticsService();
