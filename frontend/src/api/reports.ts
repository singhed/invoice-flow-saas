import {
  MonthlyIncomeData,
  OutstandingBalance,
  TopClient,
  EstimatedTaxes,
  Client,
  ApiResponse,
} from '../types';

const API_BASE = '/api/reports';

export const reportsApi = {
  getMonthlyIncome: async (
    startDate?: string,
    endDate?: string
  ): Promise<MonthlyIncomeData[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE}/monthly-income?${params}`);
    const result: ApiResponse<MonthlyIncomeData[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch monthly income');
    }
    
    return result.data;
  },

  getOutstandingBalances: async (clientId?: string): Promise<OutstandingBalance> => {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);

    const response = await fetch(`${API_BASE}/outstanding-balances?${params}`);
    const result: ApiResponse<OutstandingBalance> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch outstanding balances');
    }
    
    return result.data;
  },

  getTopClients: async (
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<TopClient[]> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE}/top-clients?${params}`);
    const result: ApiResponse<TopClient[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch top clients');
    }
    
    return result.data;
  },

  getEstimatedTaxes: async (year?: number): Promise<EstimatedTaxes> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE}/estimated-taxes?${params}`);
    const result: ApiResponse<EstimatedTaxes> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch estimated taxes');
    }
    
    return result.data;
  },

  getClients: async (): Promise<Client[]> => {
    const response = await fetch(`${API_BASE}/clients`);
    const result: ApiResponse<Client[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch clients');
    }
    
    return result.data;
  },
};
