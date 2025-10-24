'use client';

import { useState } from 'react';

interface SearchResult {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
  relevanceScore: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const mockResults: SearchResult[] = [
        {
          invoiceId: 'inv_1',
          invoiceNumber: 'INV-1001',
          customerName: 'Acme Corporation',
          amount: 5500,
          status: 'paid',
          date: '2024-01-15',
          relevanceScore: 0.95,
        },
        {
          invoiceId: 'inv_2',
          invoiceNumber: 'INV-1002',
          customerName: 'TechStart Inc',
          amount: 3200,
          status: 'pending',
          date: '2024-01-20',
          relevanceScore: 0.88,
        },
        {
          invoiceId: 'inv_3',
          invoiceNumber: 'INV-1003',
          customerName: 'Global Solutions Ltd',
          amount: 8900,
          status: 'paid',
          date: '2024-01-22',
          relevanceScore: 0.82,
        },
      ];

      await new Promise(resolve => setTimeout(resolve, 500));

      let filteredResults = mockResults;

      if (filters.status) {
        filteredResults = filteredResults.filter(r => r.status === filters.status);
      }

      if (filters.minAmount) {
        filteredResults = filteredResults.filter(r => r.amount >= parseFloat(filters.minAmount));
      }

      if (filters.maxAmount) {
        filteredResults = filteredResults.filter(r => r.amount <= parseFloat(filters.maxAmount));
      }

      setResults(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Search</h1>
          <p className="mt-2 text-gray-600">Search and filter invoices by customer, amount, status, and more</p>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by invoice number, customer name, or description..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={performSearch}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showFilters ? '− Hide Filters' : '+ Show Filters'}
          </button>

          {showFilters && (
            <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Min Amount</label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Max Amount</label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  placeholder="10000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
              <p className="text-gray-600">Searching invoices...</p>
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="mb-4 text-sm text-gray-600">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </div>

            {results.map((result) => (
              <div
                key={result.invoiceId}
                className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900">{result.invoiceNumber}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Customer:</span> {result.customerName}
                      </p>
                      <p>
                        <span className="font-medium">Amount:</span> {formatCurrency(result.amount)}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span> {new Date(result.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right text-xs text-gray-500">
                      Relevance: {(result.relevanceScore * 100).toFixed(0)}%
                    </div>
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="mb-2 text-lg font-medium text-gray-900">No results found</p>
            <p className="text-gray-600">Try adjusting your search query or filters</p>
          </div>
        )}

        {!loading && !query && results.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="mb-2 text-lg font-medium text-gray-900">Start your search</p>
            <p className="text-gray-600">Enter a search term to find invoices</p>
          </div>
        )}
      </div>
    </div>
  );
}
