import { logger } from '@invoice-saas/shared';

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
  customerId?: string;
}

interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  threshold: number;
  currentPercentage: number;
  amount: number;
  spent: number;
  remaining: number;
}

class BudgetService {
  private budgets: Map<string, Budget> = new Map();

  async createBudget(budget: Omit<Budget, 'id' | 'spent'>): Promise<Budget> {
    const id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newBudget: Budget = {
      ...budget,
      id,
      spent: 0,
    };

    this.budgets.set(id, newBudget);

    logger.info('Budget created', { budgetId: id, name: budget.name });

    return newBudget;
  }

  async getBudget(budgetId: string): Promise<Budget | null> {
    return this.budgets.get(budgetId) || null;
  }

  async getAllBudgets(filters?: { customerId?: string; period?: string }): Promise<Budget[]> {
    let budgets = Array.from(this.budgets.values());

    if (filters?.customerId) {
      budgets = budgets.filter(b => b.customerId === filters.customerId);
    }

    if (filters?.period) {
      budgets = budgets.filter(b => b.period === filters.period);
    }

    return budgets;
  }

  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget | null> {
    const budget = this.budgets.get(budgetId);
    if (!budget) return null;

    const updatedBudget = { ...budget, ...updates, id: budgetId };
    this.budgets.set(budgetId, updatedBudget);

    logger.info('Budget updated', { budgetId });

    return updatedBudget;
  }

  async deleteBudget(budgetId: string): Promise<boolean> {
    const deleted = this.budgets.delete(budgetId);

    if (deleted) {
      logger.info('Budget deleted', { budgetId });
    }

    return deleted;
  }

  async trackExpense(budgetId: string, amount: number): Promise<Budget | null> {
    const budget = this.budgets.get(budgetId);
    if (!budget) return null;

    budget.spent += amount;
    this.budgets.set(budgetId, budget);

    logger.info('Expense tracked against budget', {
      budgetId,
      amount,
      totalSpent: budget.spent,
    });

    const alerts = await this.checkBudgetAlerts(budget);
    if (alerts.length > 0) {
      logger.warn('Budget alert triggered', { budgetId, alerts });
    }

    return budget;
  }

  async getBudgetStatus(budgetId: string): Promise<{
    budget: Budget;
    percentage: number;
    remaining: number;
    isOverBudget: boolean;
  } | null> {
    const budget = this.budgets.get(budgetId);
    if (!budget) return null;

    const percentage = (budget.spent / budget.amount) * 100;
    const remaining = budget.amount - budget.spent;
    const isOverBudget = budget.spent > budget.amount;

    return {
      budget,
      percentage,
      remaining,
      isOverBudget,
    };
  }

  async getBudgetAlerts(thresholds: number[] = [50, 75, 90, 100]): Promise<BudgetAlert[]> {
    const alerts: BudgetAlert[] = [];

    for (const budget of this.budgets.values()) {
      const percentage = (budget.spent / budget.amount) * 100;

      for (const threshold of thresholds) {
        if (percentage >= threshold) {
          alerts.push({
            budgetId: budget.id,
            budgetName: budget.name,
            threshold,
            currentPercentage: percentage,
            amount: budget.amount,
            spent: budget.spent,
            remaining: budget.amount - budget.spent,
          });
          break;
        }
      }
    }

    return alerts;
  }

  private async checkBudgetAlerts(budget: Budget): Promise<BudgetAlert[]> {
    const percentage = (budget.spent / budget.amount) * 100;
    const alerts: BudgetAlert[] = [];

    const thresholds = [50, 75, 90, 100];
    for (const threshold of thresholds) {
      if (percentage >= threshold) {
        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          threshold,
          currentPercentage: percentage,
          amount: budget.amount,
          spent: budget.spent,
          remaining: budget.amount - budget.spent,
        });
      }
    }

    return alerts;
  }

  async generateBudgetReport(period: { startDate: string; endDate: string }): Promise<{
    totalBudgets: number;
    totalAllocated: number;
    totalSpent: number;
    utilizationRate: number;
    budgetsByStatus: {
      onTrack: number;
      nearLimit: number;
      overBudget: number;
    };
  }> {
    const budgets = Array.from(this.budgets.values());
    const totalAllocated = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

    const budgetsByStatus = {
      onTrack: 0,
      nearLimit: 0,
      overBudget: 0,
    };

    for (const budget of budgets) {
      const percentage = (budget.spent / budget.amount) * 100;
      if (percentage > 100) {
        budgetsByStatus.overBudget++;
      } else if (percentage >= 75) {
        budgetsByStatus.nearLimit++;
      } else {
        budgetsByStatus.onTrack++;
      }
    }

    return {
      totalBudgets: budgets.length,
      totalAllocated,
      totalSpent,
      utilizationRate: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
      budgetsByStatus,
    };
  }
}

export const budgetService = new BudgetService();
