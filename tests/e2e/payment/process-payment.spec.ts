/**
 * Process Payment E2E Tests
 * Tests for payment processing workflow
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { InvoiceHelper } from '../helpers/invoice.helper';
import { testPayments } from '../fixtures/test-data';

test.describe('Process Payment', () => {
  let authHelper: AuthHelper;
  let invoiceHelper: InvoiceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    invoiceHelper = new InvoiceHelper(page);
    
    await authHelper.setupAuthenticatedSession();
    await invoiceHelper.goToInvoiceList();
  });

  test('should process credit card payment successfully', async ({ page }) => {
    await invoiceHelper.filterByStatus('sent');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="pay-now-button"]');
    
    await page.fill('[name="cardNumber"]', testPayments.creditCard.number);
    await page.fill('[name="cardExpiry"]', testPayments.creditCard.expiry);
    await page.fill('[name="cardCvc"]', testPayments.creditCard.cvc);
    await page.fill('[name="cardZip"]', testPayments.creditCard.zip);
    
    await page.click('[data-testid="submit-payment-button"]');
    
    await expect(page.locator('.success-message')).toContainText('Payment successful');
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Paid');
  });

  test('should handle invalid card number', async ({ page }) => {
    await invoiceHelper.filterByStatus('sent');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="pay-now-button"]');
    
    await page.fill('[name="cardNumber"]', '1234567890123456');
    await page.fill('[name="cardExpiry"]', testPayments.creditCard.expiry);
    await page.fill('[name="cardCvc"]', testPayments.creditCard.cvc);
    
    await page.click('[data-testid="submit-payment-button"]');
    
    await expect(page.locator('.error-message')).toContainText('Invalid card');
  });

  test('should handle expired card', async ({ page }) => {
    await invoiceHelper.filterByStatus('sent');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="pay-now-button"]');
    
    await page.fill('[name="cardNumber"]', testPayments.creditCard.number);
    await page.fill('[name="cardExpiry"]', '01/20');
    await page.fill('[name="cardCvc"]', testPayments.creditCard.cvc);
    
    await page.click('[data-testid="submit-payment-button"]');
    
    await expect(page.locator('.error-message')).toContainText('expired');
  });

  test('should show payment processing indicator', async ({ page }) => {
    await invoiceHelper.filterByStatus('sent');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="pay-now-button"]');
    
    await page.fill('[name="cardNumber"]', testPayments.creditCard.number);
    await page.fill('[name="cardExpiry"]', testPayments.creditCard.expiry);
    await page.fill('[name="cardCvc"]', testPayments.creditCard.cvc);
    
    const submitButton = page.locator('[data-testid="submit-payment-button"]');
    await submitButton.click();
    
    await expect(submitButton).toBeDisabled();
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
  });

  test('should save payment method for future use', async ({ page }) => {
    await invoiceHelper.filterByStatus('sent');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="pay-now-button"]');
    
    await page.fill('[name="cardNumber"]', testPayments.creditCard.number);
    await page.fill('[name="cardExpiry"]', testPayments.creditCard.expiry);
    await page.fill('[name="cardCvc"]', testPayments.creditCard.cvc);
    
    await page.check('[name="saveCard"]');
    
    await page.click('[data-testid="submit-payment-button"]');
    
    await expect(page.locator('.success-message')).toContainText('Payment successful');
  });

  test('should use saved payment method', async ({ page }) => {
    await invoiceHelper.filterByStatus('sent');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="pay-now-button"]');
    
    const savedCard = page.locator('[data-testid="saved-card"]').first();
    if (await savedCard.isVisible()) {
      await savedCard.click();
      await page.fill('[name="cardCvc"]', testPayments.creditCard.cvc);
      await page.click('[data-testid="submit-payment-button"]');
      
      await expect(page.locator('.success-message')).toContainText('Payment successful');
    }
  });

  test('should show payment confirmation', async ({ page }) => {
    await invoiceHelper.filterByStatus('sent');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="pay-now-button"]');
    
    await page.fill('[name="cardNumber"]', testPayments.creditCard.number);
    await page.fill('[name="cardExpiry"]', testPayments.creditCard.expiry);
    await page.fill('[name="cardCvc"]', testPayments.creditCard.cvc);
    
    await page.click('[data-testid="submit-payment-button"]');
    
    await expect(page.locator('[data-testid="payment-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();
  });

  test('should download payment receipt', async ({ page }) => {
    await invoiceHelper.filterByStatus('paid');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-receipt-button"]'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf$/);
  });
});

test.describe('Payment History', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.setupAuthenticatedSession();
    await page.goto('/payments');
  });

  test('should view payment history', async ({ page }) => {
    await expect(page.locator('[data-testid="payment-row"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="payment-amount"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="payment-date"]').first()).toBeVisible();
  });

  test('should filter payments by date range', async ({ page }) => {
    await page.fill('[name="startDate"]', '2024-01-01');
    await page.fill('[name="endDate"]', '2024-12-31');
    await page.click('[data-testid="apply-filter-button"]');
    
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="payment-row"]').first()).toBeVisible();
  });

  test('should export payment history', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-payments-button"]'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});

test.describe('Refunds', () => {
  let authHelper: AuthHelper;
  let invoiceHelper: InvoiceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    invoiceHelper = new InvoiceHelper(page);
    
    await authHelper.setupAuthenticatedSession();
    await invoiceHelper.goToInvoiceList();
  });

  test('should process full refund', async ({ page }) => {
    await invoiceHelper.filterByStatus('paid');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="refund-button"]');
    await page.selectOption('[name="refundType"]', 'full');
    await page.fill('[name="refundReason"]', 'Customer request');
    await page.click('[data-testid="confirm-refund-button"]');
    
    await expect(page.locator('.success-message')).toContainText('Refund processed');
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Refunded');
  });

  test('should process partial refund', async ({ page }) => {
    await invoiceHelper.filterByStatus('paid');
    
    const invoiceNumber = await page.locator('[data-testid="invoice-number"]').first().textContent();
    await invoiceHelper.openInvoiceDetails(invoiceNumber!);
    
    await page.click('[data-testid="refund-button"]');
    await page.selectOption('[name="refundType"]', 'partial');
    await page.fill('[name="refundAmount"]', '500');
    await page.fill('[name="refundReason"]', 'Partial service');
    await page.click('[data-testid="confirm-refund-button"]');
    
    await expect(page.locator('.success-message')).toContainText('Refund processed');
  });
});
