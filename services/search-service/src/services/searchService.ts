import { logger } from '@invoice-saas/shared';
import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

interface SearchQuery {
  query: string;
  filters?: {
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    customerId?: string;
  };
  page: number;
  limit: number;
  sortBy: string;
}

interface SearchResult {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
  relevanceScore: number;
}

interface SearchResults {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

class SearchService {
  private readonly INDEX_KEY = 'search:invoices';
  private readonly SUGGEST_KEY = 'search:suggestions';

  async searchInvoices(query: SearchQuery): Promise<SearchResults> {
    const cacheKey = `search:query:${JSON.stringify(query)}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const mockResults: SearchResult[] = [];
    const totalResults = Math.floor(Math.random() * 100) + 20;
    const resultsToGenerate = Math.min(query.limit, totalResults - (query.page - 1) * query.limit);

    for (let i = 0; i < resultsToGenerate; i++) {
      const resultIndex = (query.page - 1) * query.limit + i;
      mockResults.push({
        invoiceId: `inv_${resultIndex + 1}`,
        invoiceNumber: `INV-${1000 + resultIndex}`,
        customerName: `Customer ${resultIndex + 1}`,
        amount: Math.floor(Math.random() * 10000) + 100,
        status: ['paid', 'pending', 'overdue', 'draft'][Math.floor(Math.random() * 4)],
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        relevanceScore: 1 - (i * 0.05),
      });
    }

    if (query.sortBy === 'date') {
      mockResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (query.sortBy === 'amount') {
      mockResults.sort((a, b) => b.amount - a.amount);
    }

    const results: SearchResults = {
      results: mockResults,
      total: totalResults,
      page: query.page,
      limit: query.limit,
      hasMore: (query.page * query.limit) < totalResults,
    };

    await redis.setex(cacheKey, config.cache.ttl, JSON.stringify(results));

    logger.info('Search performed', {
      query: query.query,
      resultsCount: results.results.length,
      totalCount: results.total,
    });

    return results;
  }

  async getAutocompleteSuggestions(query: string, limit: number): Promise<string[]> {
    const cacheKey = `suggest:${query}:${limit}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    const commonTerms = [
      'invoice', 'payment', 'pending', 'overdue', 'paid', 'draft',
      'customer', 'amount', 'status', 'date', 'total',
    ];

    for (const term of commonTerms) {
      if (term.toLowerCase().includes(queryLower)) {
        suggestions.push(term);
      }
      if (suggestions.length >= limit) break;
    }

    if (suggestions.length < limit) {
      for (let i = suggestions.length; i < limit; i++) {
        suggestions.push(`${query} ${i + 1}`);
      }
    }

    await redis.setex(cacheKey, config.cache.ttl, JSON.stringify(suggestions));

    logger.info('Autocomplete suggestions generated', {
      query,
      suggestionsCount: suggestions.length,
    });

    return suggestions;
  }

  async indexInvoice(invoiceId: string, invoiceData: any): Promise<void> {
    await redis.hset(this.INDEX_KEY, invoiceId, JSON.stringify(invoiceData));

    const terms = this.extractSearchTerms(invoiceData);
    for (const term of terms) {
      await redis.sadd(`${this.SUGGEST_KEY}:${term}`, invoiceId);
    }

    logger.info('Invoice indexed', { invoiceId });
  }

  async removeFromIndex(invoiceId: string): Promise<void> {
    const invoiceData = await redis.hget(this.INDEX_KEY, invoiceId);
    if (invoiceData) {
      const terms = this.extractSearchTerms(JSON.parse(invoiceData));
      for (const term of terms) {
        await redis.srem(`${this.SUGGEST_KEY}:${term}`, invoiceId);
      }
    }

    await redis.hdel(this.INDEX_KEY, invoiceId);

    logger.info('Invoice removed from index', { invoiceId });
  }

  async rebuildIndex(): Promise<void> {
    const keys = await redis.keys(`${this.SUGGEST_KEY}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    await redis.del(this.INDEX_KEY);

    logger.info('Search index rebuilt');
  }

  private extractSearchTerms(data: any): string[] {
    const terms: string[] = [];
    
    if (data.invoiceNumber) terms.push(data.invoiceNumber.toLowerCase());
    if (data.customerName) terms.push(...data.customerName.toLowerCase().split(' '));
    if (data.status) terms.push(data.status.toLowerCase());
    if (data.description) terms.push(...data.description.toLowerCase().split(' '));

    return [...new Set(terms)].filter(term => term.length > 2);
  }
}

export const searchService = new SearchService();
