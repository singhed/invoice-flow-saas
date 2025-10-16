export interface Attachment {
  id: number;
  expense_id: number;
  filename: string;
  content_type?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface AISuggestion {
  id: number;
  expense_id: number;
  suggested_category?: string;
  suggested_notes?: string;
  was_accepted: boolean;
  user_modified: boolean;
  final_category?: string;
  final_notes?: string;
  created_at: string;
  model_used: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date?: string;
  category?: string;
  client_notes?: string;
  created_at: string;
  updated_at: string;
  attachments: Attachment[];
  ai_suggestions: AISuggestion[];
}

export interface ExpenseCreate {
  description: string;
  amount: number;
  date?: string;
  category?: string;
  client_notes?: string;
  request_ai_suggestion?: boolean;
}

export interface AISuggestionResponse {
  category?: string;
  client_notes?: string;
  error?: string;
}
