import { prisma } from '../lib/prisma';
import { cache, CACHE_KEYS, getCacheKey } from '../lib/cache';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';

export interface MonthlyIncomeData {
  month: string;
  income: number;
  invoiceCount: number;
}

export interface OutstandingBalance {
  total: number;
  byStatus: {
    status: string;
    amount: number;
    count: number;
  }[];
}

export interface TopClient {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface EstimatedTaxes {
  year: number;
  totalIncome: number;
  totalTaxCollected: number;
  estimatedTaxLiability: number;
  taxRate: number;
}

export class ReportService {
  async getMonthlyIncome(startDate?: string, endDate?: string): Promise<MonthlyIncomeData[]> {
    const cacheKey = getCacheKey(CACHE_KEYS.MONTHLY_INCOME, { startDate, endDate });
    const cached = cache.get<MonthlyIncomeData[]>(cacheKey);
    if (cached) return cached;

    const whereClause: any = {
      status: 'PAID',
    };

    if (startDate || endDate) {
      whereClause.paidDate = {};
      if (startDate) whereClause.paidDate.gte = parseISO(startDate);
      if (endDate) whereClause.paidDate.lte = parseISO(endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      select: {
        paidDate: true,
        totalAmount: true,
      },
    });

    // Group by month
    const monthlyData = new Map<string, { income: number; count: number }>();
    
    invoices.forEach(invoice => {
      if (!invoice.paidDate) return;
      
      const monthKey = invoice.paidDate.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyData.get(monthKey) || { income: 0, count: 0 };
      
      monthlyData.set(monthKey, {
        income: existing.income + Number(invoice.totalAmount),
        count: existing.count + 1,
      });
    });

    const result: MonthlyIncomeData[] = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        invoiceCount: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    cache.set(cacheKey, result);
    return result;
  }

  async getOutstandingBalances(clientId?: string): Promise<OutstandingBalance> {
    const cacheKey = getCacheKey(CACHE_KEYS.OUTSTANDING_BALANCES, { clientId });
    const cached = cache.get<OutstandingBalance>(cacheKey);
    if (cached) return cached;

    const whereClause: any = {
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
    };

    if (clientId) {
      whereClause.clientId = clientId;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        payments: true,
      },
    });

    // Calculate outstanding amounts
    const byStatus = new Map<string, { amount: number; count: number }>();
    let total = 0;

    invoices.forEach(invoice => {
      const totalPaid = invoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );
      const outstanding = Number(invoice.totalAmount) - totalPaid;

      const existing = byStatus.get(invoice.status) || { amount: 0, count: 0 };
      byStatus.set(invoice.status, {
        amount: existing.amount + outstanding,
        count: existing.count + 1,
      });

      total += outstanding;
    });

    const result: OutstandingBalance = {
      total,
      byStatus: Array.from(byStatus.entries()).map(([status, data]) => ({
        status,
        amount: data.amount,
        count: data.count,
      })),
    };

    cache.set(cacheKey, result);
    return result;
  }

  async getTopClients(
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<TopClient[]> {
    const cacheKey = getCacheKey(CACHE_KEYS.TOP_CLIENTS, { limit, startDate, endDate });
    const cached = cache.get<TopClient[]>(cacheKey);
    if (cached) return cached;

    const whereClause: any = {
      status: 'PAID',
    };

    if (startDate || endDate) {
      whereClause.paidDate = {};
      if (startDate) whereClause.paidDate.gte = parseISO(startDate);
      if (endDate) whereClause.paidDate.lte = parseISO(endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      select: {
        clientId: true,
        totalAmount: true,
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    // Group by client
    const clientData = new Map<string, { name: string; revenue: number; count: number }>();
    
    invoices.forEach(invoice => {
      const existing = clientData.get(invoice.clientId) || {
        name: invoice.client.name,
        revenue: 0,
        count: 0,
      };
      
      clientData.set(invoice.clientId, {
        name: existing.name,
        revenue: existing.revenue + Number(invoice.totalAmount),
        count: existing.count + 1,
      });
    });

    const result: TopClient[] = Array.from(clientData.entries())
      .map(([clientId, data]) => ({
        clientId,
        clientName: data.name,
        totalRevenue: data.revenue,
        invoiceCount: data.count,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    cache.set(cacheKey, result);
    return result;
  }

  async getEstimatedTaxes(year?: number): Promise<EstimatedTaxes> {
    const targetYear = year || new Date().getFullYear();
    const cacheKey = getCacheKey(CACHE_KEYS.ESTIMATED_TAXES, { year: targetYear });
    const cached = cache.get<EstimatedTaxes>(cacheKey);
    if (cached) return cached;

    const yearStart = startOfYear(new Date(targetYear, 0, 1));
    const yearEnd = endOfYear(new Date(targetYear, 11, 31));

    const aggregations = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      _sum: {
        amount: true,
        taxAmount: true,
      },
    });

    const totalIncome = Number(aggregations._sum.amount || 0);
    const totalTaxCollected = Number(aggregations._sum.taxAmount || 0);
    
    // Estimate tax liability (example: 25% of gross income)
    const taxRate = 0.25;
    const estimatedTaxLiability = totalIncome * taxRate;

    const result: EstimatedTaxes = {
      year: targetYear,
      totalIncome,
      totalTaxCollected,
      estimatedTaxLiability,
      taxRate,
    };

    cache.set(cacheKey, result);
    return result;
  }

  async getClients() {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        company: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return clients;
  }

  clearCache() {
    cache.flushAll();
  }
}

export const reportService = new ReportService();
