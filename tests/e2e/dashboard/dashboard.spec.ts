/**
 * Dashboard E2E Tests
 * Tests for dashboard and analytics features
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';

test.describe('Dashboard', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.setupAuthenticatedSession();
    await page.goto('/dashboard');
  });

  test('should display dashboard overview', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-invoices"]')).toBeVisible();
    await expect(page.locator('[data-testid="paid-invoices"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-invoices"]')).toBeVisible();
  });

  test('should display revenue chart', async ({ page }) => {
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
  });

  test('should display recent invoices', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-invoices"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-row"]').first()).toBeVisible();
  });

  test('should display recent payments', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-payments"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-row"]').first()).toBeVisible();
  });

  test('should filter dashboard by date range', async ({ page }) => {
    await page.click('[data-testid="date-range-picker"]');
    await page.click('[data-range="last-30-days"]');
    
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="date-range-label"]')).toContainText('Last 30 days');
  });

  test('should export dashboard data', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-dashboard-button"]'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/dashboard.*\.pdf$/);
  });

  test('should navigate to invoice details from dashboard', async ({ page }) => {
    await page.click('[data-testid="invoice-row"]').first();
    
    await expect(page).toHaveURL(/\/invoices\//);
    await expect(page.locator('.invoice-details')).toBeVisible();
  });

  test('should quick create invoice from dashboard', async ({ page }) => {
    await page.click('[data-testid="quick-create-invoice"]');
    
    await expect(page.locator('[data-testid="invoice-form"]')).toBeVisible();
  });

  test('should show overdue alerts', async ({ page }) => {
    const overdueAlert = page.locator('[data-testid="overdue-alert"]');
    
    if (await overdueAlert.isVisible()) {
      await expect(overdueAlert).toContainText('overdue');
    }
  });

  test('should show payment activity', async ({ page }) => {
    await expect(page.locator('[data-testid="payment-activity"]')).toBeVisible();
  });
});

test.describe('Analytics', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.setupAuthenticatedSession();
    await page.goto('/analytics');
  });

  test('should display revenue analytics', async ({ page }) => {
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-growth"]')).toBeVisible();
  });

  test('should display customer analytics', async ({ page }) => {
    await page.click('[data-testid="customers-tab"]');
    
    await expect(page.locator('[data-testid="top-customers"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-count"]')).toBeVisible();
  });

  test('should display invoice analytics', async ({ page }) => {
    await page.click('[data-testid="invoices-tab"]');
    
    await expect(page.locator('[data-testid="invoice-status-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-invoice-value"]')).toBeVisible();
  });

  test('should switch between chart types', async ({ page }) => {
    await page.click('[data-testid="chart-type-selector"]');
    await page.click('[data-chart-type="bar"]');
    
    await expect(page.locator('[data-testid="bar-chart"]')).toBeVisible();
    
    await page.click('[data-testid="chart-type-selector"]');
    await page.click('[data-chart-type="line"]');
    
    await expect(page.locator('[data-testid="line-chart"]')).toBeVisible();
  });

  test('should export analytics report', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-report-button"]'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/analytics.*\.pdf$/);
  });

  test('should compare time periods', async ({ page }) => {
    await page.check('[name="compareEnabled"]');
    await page.click('[data-testid="comparison-period"]');
    await page.click('[data-period="previous-period"]');
    
    await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible();
  });
});

test.describe('Notifications', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.setupAuthenticatedSession();
    await page.goto('/dashboard');
  });

  test('should display notification center', async ({ page }) => {
    await page.click('[data-testid="notifications-button"]');
    
    await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible();
  });

  test('should mark notification as read', async ({ page }) => {
    await page.click('[data-testid="notifications-button"]');
    
    const unreadBadge = page.locator('[data-testid="unread-count"]');
    const initialCount = await unreadBadge.textContent();
    
    await page.click('[data-testid="notification-item"]').first();
    
    if (initialCount && parseInt(initialCount) > 0) {
      await expect(unreadBadge).not.toContainText(initialCount);
    }
  });

  test('should mark all notifications as read', async ({ page }) => {
    await page.click('[data-testid="notifications-button"]');
    await page.click('[data-testid="mark-all-read"]');
    
    await expect(page.locator('[data-testid="unread-count"]')).not.toBeVisible();
  });

  test('should filter notifications', async ({ page }) => {
    await page.click('[data-testid="notifications-button"]');
    await page.selectOption('[data-testid="notification-filter"]', 'invoices');
    
    const notifications = page.locator('[data-testid="notification-item"]');
    const count = await notifications.count();
    
    for (let i = 0; i < count; i++) {
      await expect(notifications.nth(i)).toContainText(/invoice/i);
    }
  });
});

test.describe('User Profile', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.setupAuthenticatedSession();
    await page.goto('/profile');
  });

  test('should display user profile', async ({ page }) => {
    await expect(page.locator('[data-testid="profile-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-email"]')).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    await page.click('[data-testid="edit-profile-button"]');
    
    const newName = 'Updated Name';
    await page.fill('[name="name"]', newName);
    await page.click('[data-testid="save-profile-button"]');
    
    await expect(page.locator('.success-message')).toContainText('Profile updated');
    await expect(page.locator('[data-testid="profile-name"]')).toContainText(newName);
  });

  test('should change password', async ({ page }) => {
    await page.click('[data-testid="change-password-button"]');
    
    await page.fill('[name="currentPassword"]', 'CurrentPassword123!');
    await page.fill('[name="newPassword"]', 'NewPassword123!');
    await page.fill('[name="confirmPassword"]', 'NewPassword123!');
    
    await page.click('[data-testid="save-password-button"]');
    
    await expect(page.locator('.success-message')).toContainText('Password updated');
  });

  test('should upload profile picture', async ({ page }) => {
    await page.click('[data-testid="upload-avatar-button"]');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content'),
    });
    
    await expect(page.locator('[data-testid="avatar-preview"]')).toBeVisible();
  });
});
