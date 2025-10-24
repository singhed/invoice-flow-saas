'use client';

import { useState, useEffect } from 'react';

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  category?: string;
}

interface BudgetStatus {
  budget: Budget;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBudget, setNewBudget] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    category: '',
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const mockBudgets: Budget[] = [
        {
          id: '1',
          name: 'Marketing Budget Q1',
          amount: 50000,
          spent: 32000,
          currency: 'USD',
          period: 'quarterly',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          category: 'Marketing',
        },
        {
          id: '2',
          name: 'Development Team - January',
          amount: 120000,
          spent: 85000,
          currency: 'USD',
          period: 'monthly',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          category: 'Development',
        },
        {
          id: '3',
          name: 'Infrastructure 2024',
          amount: 200000,
          spent: 45000,
          currency: 'USD',
          period: 'yearly',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          category: 'Infrastructure',
        },
      ];

      setBudgets(mockBudgets);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async () => {
    if (!newBudget.name || !newBudget.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    
    if (newBudget.period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (newBudget.period === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const budget: Budget = {
      id: `budget_${Date.now()}`,
      name: newBudget.name,
      amount: parseFloat(newBudget.amount),
      spent: 0,
      currency: newBudget.currency,
      period: newBudget.period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      category: newBudget.category,
    };

    setBudgets([...budgets, budget]);
    setShowCreateModal(false);
    setNewBudget({
      name: '',
      amount: '',
      currency: 'USD',
      period: 'monthly',
      category: '',
    });
  };

  const deleteBudget = async (budgetId: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      setBudgets(budgets.filter(b => b.id !== budgetId));
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getBudgetStatus = (budget: Budget): { color: string; status: string } => {
    const percentage = (budget.spent / budget.amount) * 100;
    
    if (percentage > 100) {
      return { color: 'text-red-600', status: 'Over Budget' };
    } else if (percentage >= 90) {
      return { color: 'text-orange-600', status: 'Critical' };
    } else if (percentage >= 75) {
      return { color: 'text-yellow-600', status: 'Warning' };
    } else {
      return { color: 'text-green-600', status: 'On Track' };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-600">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget Tracking</h1>
            <p className="mt-2 text-gray-600">Monitor and manage your budgets across different categories</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Create Budget
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="mb-4 text-gray-600">No budgets found. Create your first budget to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Create Budget
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => {
              const percentage = (budget.spent / budget.amount) * 100;
              const remaining = budget.amount - budget.spent;
              const statusInfo = getBudgetStatus(budget);

              return (
                <div key={budget.id} className="rounded-lg bg-white p-6 shadow">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{budget.name}</h3>
                      {budget.category && (
                        <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                          {budget.category}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className={`font-medium ${statusInfo.color}`}>{statusInfo.status}</span>
                      <span className="text-gray-600">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-3 rounded-full ${
                          percentage > 100
                            ? 'bg-red-600'
                            : percentage >= 90
                            ? 'bg-orange-600'
                            : percentage >= 75
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Budget:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(budget.amount, budget.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spent:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(budget.spent, budget.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Remaining:</span>
                      <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(remaining, budget.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-4 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Period: {budget.period}</span>
                      <span>
                        {budget.startDate} to {budget.endDate}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Create New Budget</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Budget Name</label>
                  <input
                    type="text"
                    value={newBudget.name}
                    onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    placeholder="e.g., Marketing Q1 2024"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Period</label>
                  <select
                    value={newBudget.period}
                    onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category (Optional)</label>
                  <input
                    type="text"
                    value={newBudget.category}
                    onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    placeholder="e.g., Marketing, Development"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={createBudget}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Create Budget
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
