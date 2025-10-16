import React, { useState, useEffect } from 'react';
import './App.css';
import { expenseAPI } from './api';
import { Expense, ExpenseCreate } from './types';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseCard } from './components/ExpenseCard';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseAPI.getAll();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      alert('Failed to load expenses. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (expense: ExpenseCreate) => {
    await expenseAPI.create(expense);
    await loadExpenses();
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseAPI.delete(id);
      await loadExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense');
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>💰 Expense Management</h1>
        <p>AI-powered expense tracking with smart categorization and client notes</p>
      </div>

      <div className="controls">
        <div>
          <h2 style={{ margin: 0 }}>
            Expenses ({expenses.length})
          </h2>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + New Expense
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <h2>No expenses yet</h2>
          <p>Create your first expense to get started with AI-powered categorization</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Create First Expense
          </button>
        </div>
      ) : (
        <div className="expense-list">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onUpdate={loadExpenses}
              onDelete={handleDeleteExpense}
            />
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Expense</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <ExpenseForm
              onSubmit={handleCreateExpense}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
