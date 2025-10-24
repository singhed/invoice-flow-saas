'use client';

import { useState, useEffect } from 'react';

interface DashboardData {
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

interface StatusBreakdown {
  status: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    });

    loadAnalytics(startDate, endDate);
  }, []);

  const loadAnalytics = async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const mockDashboard: DashboardData = {
        totalRevenue: 285000,
        totalInvoices: 234,
        paidInvoices: 198,
        pendingInvoices: 28,
        overdueInvoices: 8,
        averageInvoiceValue: 1218,
        paymentRate: 0.846,
      };

      const mockTrends: RevenueTrend[] = [
        { period: 'Week 1', revenue: 45000, invoiceCount: 32 },
        { period: 'Week 2', revenue: 52000, invoiceCount: 38 },
        { period: 'Week 3', revenue: 48000, invoiceCount: 35 },
        { period: 'Week 4', revenue: 55000, invoiceCount: 41 },
      ];

      const mockStatus: StatusBreakdown[] = [
        { status: 'paid', count: 198, totalAmount: 241000, percentage: 84.6 },
        { status: 'pending', count: 28, totalAmount: 34000, percentage: 12.0 },
        { status: 'overdue', count: 8, totalAmount: 10000, percentage: 3.4 },
      ];

      setDashboardData(mockDashboard);
      setRevenueTrends(mockTrends);
      setStatusBreakdown(mockStatus);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your invoice performance and revenue metrics
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => loadAnalytics(new Date(dateRange.start), new Date(dateRange.end))}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>

        {dashboardData && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-2 text-sm font-medium text-gray-600">Total Revenue</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.totalRevenue)}
                </div>
                <div className="mt-2 text-sm text-green-600">+12.5% from last period</div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-2 text-sm font-medium text-gray-600">Total Invoices</div>
                <div className="text-3xl font-bold text-gray-900">{dashboardData.totalInvoices}</div>
                <div className="mt-2 text-sm text-gray-500">
                  {dashboardData.paidInvoices} paid, {dashboardData.pendingInvoices} pending
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-2 text-sm font-medium text-gray-600">Avg Invoice Value</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.averageInvoiceValue)}
                </div>
                <div className="mt-2 text-sm text-gray-500">Per invoice</div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-2 text-sm font-medium text-gray-600">Payment Rate</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPercentage(dashboardData.paymentRate)}
                </div>
                <div className="mt-2 text-sm text-red-600">{dashboardData.overdueInvoices} overdue</div>
              </div>
            </div>

            <div className="mb-8 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Revenue Trends</h2>
              <div className="space-y-4">
                {revenueTrends.map((trend, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-24 text-sm font-medium text-gray-700">{trend.period}</div>
                    <div className="flex-1">
                      <div className="relative h-8 rounded-full bg-gray-200">
                        <div
                          className="absolute left-0 top-0 h-8 rounded-full bg-blue-600"
                          style={{ width: `${(trend.revenue / 60000) * 100}%` }}
                        ></div>
                        <div className="relative flex h-8 items-center px-4 text-sm font-medium text-gray-900">
                          {formatCurrency(trend.revenue)} ({trend.invoiceCount} invoices)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Invoice Status Breakdown</h2>
              <div className="space-y-4">
                {statusBreakdown.map((status, index) => (
                  <div key={index}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-gray-700">{status.status}</span>
                      <span className="text-sm text-gray-600">
                        {status.count} invoices ({formatPercentage(status.percentage / 100)})
                      </span>
                    </div>
                    <div className="relative h-4 rounded-full bg-gray-200">
                      <div
                        className={`absolute left-0 top-0 h-4 rounded-full ${
                          status.status === 'paid'
                            ? 'bg-green-600'
                            : status.status === 'pending'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${status.percentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">{formatCurrency(status.totalAmount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
