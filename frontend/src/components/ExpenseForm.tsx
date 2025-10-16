import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../api';
import { ExpenseCreate, AISuggestionResponse } from '../types';

interface ExpenseFormProps {
  onSubmit: (expense: ExpenseCreate) => Promise<void>;
  onClose: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, onClose }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionResponse | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await expenseAPI.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleGetAISuggestions = async () => {
    if (!description || !amount) {
      return;
    }

    setLoadingAI(true);
    try {
      const suggestions = await expenseAPI.getAISuggestions(description, parseFloat(amount));
      setAiSuggestions(suggestions);
      
      if (suggestions.category && !category) {
        setCategory(suggestions.category);
      }
      if (suggestions.client_notes && !clientNotes) {
        setClientNotes(suggestions.client_notes);
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expense: ExpenseCreate = {
        description,
        amount: parseFloat(amount),
        date: date || undefined,
        category: category || undefined,
        client_notes: clientNotes || undefined,
        request_ai_suggestion: useAI,
      };

      await onSubmit(expense);
      onClose();
    } catch (error) {
      console.error('Failed to create expense:', error);
      alert('Failed to create expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="e.g., Lunch meeting with client"
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount ($) *</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="0.00"
        />
      </div>

      <div className="form-group">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {description && amount && (
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleGetAISuggestions}
            disabled={loadingAI}
          >
            {loadingAI ? '🤖 Getting AI Suggestions...' : '🤖 Get AI Suggestions'}
          </button>
        </div>
      )}

      {aiSuggestions && !aiSuggestions.error && (
        <div className="ai-suggestion-box">
          <h3>✨ AI Suggestions</h3>
          {aiSuggestions.category && (
            <div className="suggestion-item">
              <div className="suggestion-label">Suggested Category</div>
              <div className="suggestion-value">{aiSuggestions.category}</div>
            </div>
          )}
          {aiSuggestions.client_notes && (
            <div className="suggestion-item">
              <div className="suggestion-label">Suggested Client Notes</div>
              <div className="suggestion-value">{aiSuggestions.client_notes}</div>
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select a category...</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="clientNotes">Client Notes</label>
        <textarea
          id="clientNotes"
          value={clientNotes}
          onChange={(e) => setClientNotes(e.target.value)}
          placeholder="Professional notes suitable for client reports"
        />
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            id="useAI"
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
          />
          <label htmlFor="useAI" style={{ marginBottom: 0 }}>
            Request AI suggestions on submit (for audit trail)
          </label>
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Expense'}
        </button>
      </div>
    </form>
  );
};
