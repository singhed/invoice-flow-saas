export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  name: string;
  email: string;
  address?: string;
}

export interface InvoiceData {
  number: string;
  date: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
}

export interface AiInvoiceResponse {
  customer: Customer;
  invoice: InvoiceData;
  lineItems: LineItem[];
  confidence: number;
  rawExtraction?: string;
}

export interface GeneratedInvoice extends AiInvoiceResponse {
  isEditing: boolean;
}
