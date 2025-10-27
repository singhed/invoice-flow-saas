/**
 * Send Invoice E2E Tests
 * Tests for invoice sending and email functionality
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { InvoiceHelper } from '../helpers/invoice.helper';

test.describe('Send Invoice', () => {
  let authHelper: AuthHelper;
  let invoiceHelper: InvoiceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    invoiceHelper = new InvoiceHelper(page);
    
    await authHelper.setupAuthenticatedSession();
    await invoiceHelper.goToInvoiceList();
  });

  test('should send invoice via email', async ({ page }) => {
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await invoiceHelper.sendInvoice();
    
    await expect(page.locator('.success-message')).toContainText('Invoice sent successfully');
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Sent');
  });

  test('should send to custom email', async ({ page }) => {
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    const customEmail = 'custom@example.com';
    await invoiceHelper.sendInvoice(customEmail);
    
    await expect(page.locator('.success-message')).toContainText('sent');
  });

  test('should preview email before sending', async ({ page }) => {
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="send-invoice-button"]');
    await page.click('[data-testid="preview-email-button"]');
    
    await expect(page.locator('[data-testid="email-preview"]')).toBeVisible();
    await expect(page.locator('.email-subject')).toBeVisible();
    await expect(page.locator('.email-body')).toBeVisible();
  });

  test('should customize email message', async ({ page }) => {
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="send-invoice-button"]');
    
    const customMessage = 'Thank you for your business!';
    await page.fill('[name="emailMessage"]', customMessage);
    
    await page.click('[data-testid="confirm-send-button"]');
    
    await expect(page.locator('.success-message')).toContainText('sent');
  });

  test('should send reminder for unpaid invoice', async ({ page }) => {
    await invoiceHelper.filterByStatus('sent');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="send-reminder-button"]');
    await page.click('[data-testid="confirm-reminder"]');
    
    await expect(page.locator('.success-message')).toContainText('Reminder sent');
  });

  test('should download PDF before sending', async ({ page }) => {
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await invoiceHelper.downloadPDF();
  });

  test('should handle email sending failure', async ({ page, context }) => {
    await context.route('**/api/invoices/*/send', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Email service unavailable' }),
      });
    });
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="send-invoice-button"]');
    await page.click('[data-testid="confirm-send-button"]');
    
    await expect(page.locator('.error-message')).toContainText('failed');
  });

  test('should validate email address', async ({ page }) => {
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="send-invoice-button"]');
    await page.fill('[name="recipientEmail"]', 'invalid-email');
    await page.click('[data-testid="confirm-send-button"]');
    
    await expect(page.locator('.error-message')).toContainText('Invalid email');
  });

  test('should show send history', async ({ page }) => {
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="send-history-button"]');
    
    await expect(page.locator('[data-testid="send-history-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-history-item"]').first()).toBeVisible();
  });
});

test.describe('Batch Send Invoices', () => {
  let authHelper: AuthHelper;
  let invoiceHelper: InvoiceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    invoiceHelper = new InvoiceHelper(page);
    
    await authHelper.setupAuthenticatedSession();
    await invoiceHelper.goToInvoiceList();
  });

  test('should send multiple invoices', async ({ page }) => {
    await page.click('[data-testid="invoice-checkbox"]').first();
    await page.click('[data-testid="invoice-checkbox"]').nth(1);
    
    await page.click('[data-testid="bulk-actions-button"]');
    await page.click('[data-action="send-invoices"]');
    await page.click('[data-testid="confirm-batch-send"]');
    
    await expect(page.locator('.success-message')).toContainText('invoices sent');
  });

  test('should show batch send progress', async ({ page }) => {
    await page.click('[data-testid="select-all-checkbox"]');
    
    await page.click('[data-testid="bulk-actions-button"]');
    await page.click('[data-action="send-invoices"]');
    await page.click('[data-testid="confirm-batch-send"]');
    
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });
});
