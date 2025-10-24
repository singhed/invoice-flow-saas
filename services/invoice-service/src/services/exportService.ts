import { logger } from '@invoice-saas/shared';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  description?: string;
}

interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
  };
}

class ExportService {
  async exportInvoices(invoices: Invoice[], format: string): Promise<Buffer | string> {
    if (format === 'csv') {
      return this.generateCSV(invoices);
    } else if (format === 'json') {
      return this.generateJSON(invoices);
    } else if (format === 'excel') {
      return this.generateExcelCompatibleCSV(invoices);
    }
    throw new Error(`Unsupported format: ${format}`);
  }

  private generateCSV(invoices: Invoice[]): string {
    const headers = [
      'Invoice Number',
      'Customer Name',
      'Customer Email',
      'Amount',
      'Currency',
      'Status',
      'Issue Date',
      'Due Date',
      'Paid Date',
      'Description',
    ];

    const rows = invoices.map(invoice => [
      this.escapeCSV(invoice.invoiceNumber),
      this.escapeCSV(invoice.customerName),
      this.escapeCSV(invoice.customerEmail),
      invoice.amount.toString(),
      invoice.currency,
      invoice.status,
      invoice.issueDate,
      invoice.dueDate,
      invoice.paidDate || '',
      this.escapeCSV(invoice.description || ''),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    logger.info('CSV export generated', { count: invoices.length });

    return csv;
  }

  private generateExcelCompatibleCSV(invoices: Invoice[]): string {
    const csv = this.generateCSV(invoices);
    return '\uFEFF' + csv;
  }

  private generateJSON(invoices: Invoice[]): string {
    const json = JSON.stringify({
      exportDate: new Date().toISOString(),
      totalInvoices: invoices.length,
      invoices: invoices.map(invoice => ({
        invoiceNumber: invoice.invoiceNumber,
        customer: {
          name: invoice.customerName,
          email: invoice.customerEmail,
        },
        amount: {
          value: invoice.amount,
          currency: invoice.currency,
        },
        status: invoice.status,
        dates: {
          issued: invoice.issueDate,
          due: invoice.dueDate,
          paid: invoice.paidDate,
        },
        description: invoice.description,
      })),
    }, null, 2);

    logger.info('JSON export generated', { count: invoices.length });

    return json;
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      csv: 'text/csv',
      json: 'application/json',
      excel: 'application/vnd.ms-excel',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      csv: 'csv',
      json: 'json',
      excel: 'csv',
    };
    return extensions[format] || 'txt';
  }
}

export const exportService = new ExportService();
