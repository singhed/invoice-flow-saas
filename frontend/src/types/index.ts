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

export interface Client {
  id: string;
  name: string;
  company: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
