import axios from 'axios';
import { Expense, ExpenseCreate, AISuggestionResponse } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const expenseAPI = {
  getAll: async (): Promise<Expense[]> => {
    const response = await api.get<Expense[]>('/api/expenses');
    return response.data;
  },

  getById: async (id: number): Promise<Expense> => {
    const response = await api.get<Expense>(`/api/expenses/${id}`);
    return response.data;
  },

  create: async (expense: ExpenseCreate): Promise<Expense> => {
    const response = await api.post<Expense>('/api/expenses', expense);
    return response.data;
  },

  update: async (id: number, expense: Partial<ExpenseCreate>): Promise<Expense> => {
    const response = await api.put<Expense>(`/api/expenses/${id}`, expense);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/expenses/${id}`);
  },

  uploadAttachment: async (expenseId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/api/expenses/${expenseId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteAttachment: async (expenseId: number, attachmentId: number): Promise<void> => {
    await api.delete(`/api/expenses/${expenseId}/attachments/${attachmentId}`);
  },

  getAttachmentUrl: (expenseId: number, attachmentId: number): string => {
    return `${API_BASE_URL}/api/expenses/${expenseId}/attachments/${attachmentId}`;
  },

  getAISuggestions: async (description: string, amount: number): Promise<AISuggestionResponse> => {
    const response = await api.post<AISuggestionResponse>('/api/expenses/ai-suggest', {
      description,
      amount,
    });
    return response.data;
  },

  approveAISuggestion: async (
    expenseId: number,
    suggestionId: number,
    acceptCategory: boolean,
    acceptNotes: boolean,
    customCategory?: string,
    customNotes?: string
  ): Promise<Expense> => {
    const response = await api.post<Expense>(
      `/api/expenses/${expenseId}/ai-suggestions/${suggestionId}/approve`,
      {
        suggestion_id: suggestionId,
        accept_category: acceptCategory,
        accept_notes: acceptNotes,
        custom_category: customCategory,
        custom_notes: customNotes,
      }
    );
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<{ categories: string[] }>('/api/categories');
    return response.data.categories;
  },
};
