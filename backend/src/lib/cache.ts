import NodeCache from 'node-cache';

// Cache with 5 minute TTL by default
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const CACHE_KEYS = {
  MONTHLY_INCOME: 'monthly-income',
  OUTSTANDING_BALANCES: 'outstanding-balances',
  TOP_CLIENTS: 'top-clients',
  ESTIMATED_TAXES: 'estimated-taxes',
};

export function getCacheKey(key: string, params?: Record<string, any>): string {
  if (!params) return key;
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `${key}:${paramString}`;
}
