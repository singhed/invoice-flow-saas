/**
 * Invoice Helper
 * Utility functions for invoice operations in E2E tests
 */

import { Page, expect } from '@playwright/test';
import { testInvoices } from '../fixtures/test-data';

export class InvoiceHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to invoice list
   */
  async goToInvoiceList() {
    await this.page.goto('/invoices');
    await expect(this.page.locator('h1')).toContainText('Invoices');
  }

  /**
   * Create invoice via UI
   */
  async createInvoice(invoiceData = testInvoices.basic) {
    await this.page.click('[data-testid="create-invoice-button"]');
    
    await this.page.fill('[name="clientName"]', invoiceData.clientName);
    await this.page.fill('[name="clientEmail"]', invoiceData.clientEmail);
    await this.page.fill('[name="amount"]', invoiceData.amount.toString());
    await this.page.selectOption('[name="currency"]', invoiceData.currency);
    await this.page.fill('[name="dueDate"]', invoiceData.dueDate);
    
    if (invoiceData.description) {
      await this.page.fill('[name="description"]', invoiceData.description);
    }
    
    await this.page.click('button[type="submit"]');
    
    await expect(this.page.locator('.success-message')).toBeVisible();
  }

  /**
   * Create invoice with line items
   */
  async createInvoiceWithItems(invoiceData = testInvoices.withItems) {
    await this.page.click('[data-testid="create-invoice-button"]');
    
    await this.page.fill('[name="clientName"]', invoiceData.clientName);
    await this.page.fill('[name="clientEmail"]', invoiceData.clientEmail);
    await this.page.fill('[name="dueDate"]', invoiceData.dueDate);
    
    if (invoiceData.items) {
      for (let i = 0; i < invoiceData.items.length; i++) {
        const item = invoiceData.items[i];
        
        if (i > 0) {
          await this.page.click('[data-testid="add-item-button"]');
        }
        
        await this.page.fill(`[name="items[${i}].description"]`, item.description);
        await this.page.fill(`[name="items[${i}].quantity"]`, item.quantity.toString());
        await this.page.fill(`[name="items[${i}].unitPrice"]`, item.unitPrice.toString());
      }
    }
    
    await this.page.click('button[type="submit"]');
    await expect(this.page.locator('.success-message')).toBeVisible();
  }

  /**
   * Search for invoice
   */
  async searchInvoice(searchTerm: string) {
    await this.page.fill('[data-testid="search-input"]', searchTerm);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter invoices by status
   */
  async filterByStatus(status: string) {
    await this.page.selectOption('[data-testid="status-filter"]', status);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open invoice details
   */
  async openInvoiceDetails(invoiceNumber: string) {
    await this.page.click(`[data-invoice-number="${invoiceNumber}"]`);
    await expect(this.page.locator('.invoice-details')).toBeVisible();
  }

  /**
   * Update invoice status
   */
  async updateStatus(newStatus: string) {
    await this.page.click('[data-testid="status-dropdown"]');
    await this.page.click(`[data-status="${newStatus}"]`);
    await expect(this.page.locator('.success-message')).toBeVisible();
  }

  /**
   * Send invoice via email
   */
  async sendInvoice(email?: string) {
    await this.page.click('[data-testid="send-invoice-button"]');
    
    if (email) {
      await this.page.fill('[name="recipientEmail"]', email);
    }
    
    await this.page.click('[data-testid="confirm-send-button"]');
    await expect(this.page.locator('.success-message')).toContainText('sent');
  }

  /**
   * Download invoice PDF
   */
  async downloadPDF() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click('[data-testid="download-pdf-button"]'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    return download;
  }

  /**
   * Delete invoice
   */
  async deleteInvoice() {
    await this.page.click('[data-testid="delete-invoice-button"]');
    await this.page.click('[data-testid="confirm-delete-button"]');
    await expect(this.page.locator('.success-message')).toContainText('deleted');
  }

  /**
   * Verify invoice exists in list
   */
  async verifyInvoiceInList(clientName: string) {
    await expect(
      this.page.locator(`[data-client-name="${clientName}"]`)
    ).toBeVisible();
  }

  /**
   * Get invoice count
   */
  async getInvoiceCount(): Promise<number> {
    const countText = await this.page.locator('[data-testid="invoice-count"]').textContent();
    return parseInt(countText || '0', 10);
  }

  /**
   * Verify total amount
   */
  async verifyTotalAmount(expectedAmount: number) {
    await expect(
      this.page.locator('[data-testid="total-amount"]')
    ).toContainText(expectedAmount.toFixed(2));
  }
}
