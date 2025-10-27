/**
 * Create Invoice E2E Tests
 * Tests for invoice creation workflow
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { InvoiceHelper } from '../helpers/invoice.helper';
import { testInvoices } from '../fixtures/test-data';

test.describe('Create Invoice', () => {
  let authHelper: AuthHelper;
  let invoiceHelper: InvoiceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    invoiceHelper = new InvoiceHelper(page);
    
    await authHelper.setupAuthenticatedSession();
    await page.goto('/invoices');
  });

  test('should create basic invoice successfully', async ({ page }) => {
    const initialCount = await invoiceHelper.getInvoiceCount();
    
    await invoiceHelper.createInvoice(testInvoices.basic);
    
    const newCount = await invoiceHelper.getInvoiceCount();
    expect(newCount).toBe(initialCount + 1);
    
    await invoiceHelper.verifyInvoiceInList(testInvoices.basic.clientName);
  });

  test('should create invoice with multiple line items', async ({ page }) => {
    await invoiceHelper.createInvoiceWithItems(testInvoices.withItems);
    
    await invoiceHelper.verifyInvoiceInList(testInvoices.withItems.clientName);
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    const items = page.locator('[data-testid="invoice-item"]');
    await expect(items).toHaveCount(testInvoices.withItems.items!.length);
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('[data-testid="create-invoice-button"]');
    await page.click('button[type="submit"]');
    
    const errors = page.locator('.error-message');
    await expect(errors.first()).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.click('[data-testid="create-invoice-button"]');
    
    await page.fill('[name="clientEmail"]', 'invalid-email');
    await page.fill('[name="clientName"]', 'Test Client');
    await page.fill('[name="amount"]', '100');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText('Invalid email');
  });

  test('should validate amount is positive', async ({ page }) => {
    await page.click('[data-testid="create-invoice-button"]');
    
    await page.fill('[name="amount"]', '-100');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText('greater than 0');
  });

  test('should calculate total automatically', async ({ page }) => {
    await page.click('[data-testid="create-invoice-button"]');
    
    await page.fill('[name="items[0].quantity"]', '5');
    await page.fill('[name="items[0].unitPrice"]', '100');
    
    await expect(page.locator('[data-testid="item-total"]')).toContainText('500.00');
    await expect(page.locator('[data-testid="invoice-total"]')).toContainText('500.00');
  });

  test('should add and remove line items', async ({ page }) => {
    await page.click('[data-testid="create-invoice-button"]');
    
    await page.click('[data-testid="add-item-button"]');
    let items = page.locator('[data-testid="invoice-item-row"]');
    await expect(items).toHaveCount(2);
    
    await page.click('[data-testid="remove-item-button"]').first();
    items = page.locator('[data-testid="invoice-item-row"]');
    await expect(items).toHaveCount(1);
  });

  test('should apply tax and discount', async ({ page }) => {
    await page.click('[data-testid="create-invoice-button"]');
    
    await page.fill('[name="amount"]', '1000');
    await page.fill('[name="taxRate"]', '10');
    await page.fill('[name="discount"]', '100');
    
    await expect(page.locator('[data-testid="subtotal"]')).toContainText('1000.00');
    await expect(page.locator('[data-testid="tax-amount"]')).toContainText('100.00');
    await expect(page.locator('[data-testid="discount-amount"]')).toContainText('100.00');
    await expect(page.locator('[data-testid="total"]')).toContainText('1000.00');
  });

  test('should save as draft', async ({ page }) => {
    await page.click('[data-testid="create-invoice-button"]');
    
    await page.fill('[name="clientName"]', testInvoices.basic.clientName);
    await page.fill('[name="clientEmail"]', testInvoices.basic.clientEmail);
    await page.fill('[name="amount"]', testInvoices.basic.amount.toString());
    
    await page.click('[data-testid="save-draft-button"]');
    
    await expect(page.locator('.success-message')).toContainText('saved as draft');
    
    await invoiceHelper.filterByStatus('draft');
    await invoiceHelper.verifyInvoiceInList(testInvoices.basic.clientName);
  });

  test('should upload attachment', async ({ page }) => {
    await page.click('[data-testid="create-invoice-button"]');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-attachment.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test pdf content'),
    });
    
    await expect(page.locator('[data-testid="attachment-preview"]')).toBeVisible();
  });

  test('should preview before creating', async ({ page }) => {
    await page.click('[data-testid="create-invoice-button"]');
    
    await page.fill('[name="clientName"]', testInvoices.basic.clientName);
    await page.fill('[name="clientEmail"]', testInvoices.basic.clientEmail);
    await page.fill('[name="amount"]', testInvoices.basic.amount.toString());
    
    await page.click('[data-testid="preview-button"]');
    
    await expect(page.locator('[data-testid="invoice-preview"]')).toBeVisible();
    await expect(page.locator('.preview-client-name')).toContainText(testInvoices.basic.clientName);
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    await context.route('**/api/invoices', route => route.abort());
    
    await page.click('[data-testid="create-invoice-button"]');
    await page.fill('[name="clientName"]', testInvoices.basic.clientName);
    await page.fill('[name="amount"]', '1000');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText('network error');
  });
});

test.describe('Invoice Templates', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.setupAuthenticatedSession();
    await page.goto('/invoices/new');
  });

  test('should use invoice template', async ({ page }) => {
    await page.click('[data-testid="use-template-button"]');
    await page.click('[data-template="professional"]');
    
    await expect(page.locator('[name="clientName"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="template-indicator"]')).toContainText('Professional');
  });

  test('should save as template', async ({ page }) => {
    await page.fill('[name="clientName"]', 'Template Client');
    await page.fill('[name="amount"]', '1000');
    
    await page.click('[data-testid="save-as-template-button"]');
    await page.fill('[name="templateName"]', 'My Template');
    await page.click('[data-testid="confirm-save-template"]');
    
    await expect(page.locator('.success-message')).toContainText('Template saved');
  });
});
