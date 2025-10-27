/**
 * Manage Invoice E2E Tests
 * Tests for invoice management operations
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { InvoiceHelper } from '../helpers/invoice.helper';
import { testInvoices } from '../fixtures/test-data';

test.describe('Manage Invoices', () => {
  let authHelper: AuthHelper;
  let invoiceHelper: InvoiceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    invoiceHelper = new InvoiceHelper(page);
    
    await authHelper.setupAuthenticatedSession();
    await invoiceHelper.goToInvoiceList();
  });

  test('should view invoice details', async ({ page }) => {
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await expect(page.locator('.invoice-details')).toBeVisible();
    await expect(page.locator('[data-testid="client-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-amount"]')).toBeVisible();
  });

  test('should edit invoice', async ({ page }) => {
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="edit-invoice-button"]');
    
    const newClientName = 'Updated Client Name';
    await page.fill('[name="clientName"]', newClientName);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[data-testid="client-name"]')).toContainText(newClientName);
  });

  test('should delete invoice', async ({ page }) => {
    const initialCount = await invoiceHelper.getInvoiceCount();
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await invoiceHelper.deleteInvoice();
    
    const newCount = await invoiceHelper.getInvoiceCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should filter invoices by status', async ({ page }) => {
    await invoiceHelper.filterByStatus('paid');
    
    const invoices = page.locator('[data-testid="invoice-row"]');
    const count = await invoices.count();
    
    for (let i = 0; i < count; i++) {
      await expect(invoices.nth(i).locator('[data-testid="status-badge"]')).toContainText('Paid');
    }
  });

  test('should search invoices', async ({ page }) => {
    const searchTerm = 'Acme';
    await invoiceHelper.searchInvoice(searchTerm);
    
    const results = page.locator('[data-testid="invoice-row"]');
    const count = await results.count();
    
    for (let i = 0; i < count; i++) {
      const text = await results.nth(i).textContent();
      expect(text).toContain(searchTerm);
    }
  });

  test('should sort invoices', async ({ page }) => {
    await page.click('[data-testid="sort-by-amount"]');
    
    const amounts = await page.locator('[data-testid="invoice-amount"]').allTextContents();
    const numericAmounts = amounts.map(a => parseFloat(a.replace(/[^0-9.]/g, '')));
    
    const sorted = [...numericAmounts].sort((a, b) => b - a);
    expect(numericAmounts).toEqual(sorted);
  });

  test('should paginate invoice list', async ({ page }) => {
    const totalCount = await invoiceHelper.getInvoiceCount();
    
    if (totalCount > 20) {
      await page.click('[data-testid="next-page-button"]');
      await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 2');
      
      await page.click('[data-testid="previous-page-button"]');
      await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 1');
    }
  });

  test('should change items per page', async ({ page }) => {
    await page.selectOption('[data-testid="items-per-page"]', '50');
    await page.waitForLoadState('networkidle');
    
    const invoices = page.locator('[data-testid="invoice-row"]');
    const count = await invoices.count();
    expect(count).toBeLessThanOrEqual(50);
  });

  test('should export invoices', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-button"]'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should bulk select invoices', async ({ page }) => {
    await page.click('[data-testid="select-all-checkbox"]');
    
    const checkboxes = page.locator('[data-testid="invoice-checkbox"]:checked');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should bulk update status', async ({ page }) => {
    await page.click('[data-testid="invoice-checkbox"]').first();
    await page.click('[data-testid="invoice-checkbox"]').nth(1);
    
    await page.click('[data-testid="bulk-actions-button"]');
    await page.click('[data-action="mark-as-sent"]');
    
    await expect(page.locator('.success-message')).toContainText('updated');
  });

  test('should show invoice statistics', async ({ page }) => {
    await expect(page.locator('[data-testid="total-invoices"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="paid-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-count"]')).toBeVisible();
  });
});

test.describe('Invoice Status Management', () => {
  let authHelper: AuthHelper;
  let invoiceHelper: InvoiceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    invoiceHelper = new InvoiceHelper(page);
    
    await authHelper.setupAuthenticatedSession();
    await invoiceHelper.goToInvoiceList();
  });

  test('should update invoice to sent', async ({ page }) => {
    await invoiceHelper.filterByStatus('draft');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await invoiceHelper.updateStatus('sent');
    
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Sent');
  });

  test('should mark invoice as paid', async ({ page }) => {
    await invoiceHelper.filterByStatus('sent');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="mark-as-paid-button"]');
    await page.fill('[name="paymentDate"]', '2024-10-27');
    await page.click('[data-testid="confirm-paid-button"]');
    
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Paid');
  });

  test('should handle overdue invoices', async ({ page }) => {
    await invoiceHelper.filterByStatus('overdue');
    
    const overdueInvoices = page.locator('[data-testid="invoice-row"]');
    const count = await overdueInvoices.count();
    
    if (count > 0) {
      await expect(overdueInvoices.first().locator('[data-testid="overdue-badge"]')).toBeVisible();
    }
  });
});
