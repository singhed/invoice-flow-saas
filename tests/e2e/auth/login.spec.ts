/**
 * User Login E2E Tests
 * Tests for user authentication flow
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { testUsers } from '../fixtures/test-data';

test.describe('User Login', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await page.goto('/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await authHelper.login(testUsers.user.email, testUsers.user.password);
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('[name="email"]', testUsers.user.email);
    await page.fill('[name="password"]', 'WrongPassword123!');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.fill('[name="email"]', 'nonexistent@example.com');
    await page.fill('[name="password"]', 'Password123!');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    const errors = page.locator('.error-message');
    await expect(errors).toHaveCount(2);
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('[data-testid="register-link"]');
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.click('[data-testid="forgot-password-link"]');
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should remember user session', async ({ page, context }) => {
    await authHelper.login(testUsers.user.email, testUsers.user.password);
    
    const cookies = await context.cookies();
    expect(cookies.some(c => c.name === 'auth_token')).toBeTruthy();
  });

  test('should logout successfully', async ({ page }) => {
    await authHelper.login(testUsers.user.email, testUsers.user.password);
    await authHelper.logout();
    
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to requested page after login', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveURL(/\/login/);
    
    await authHelper.login(testUsers.user.email, testUsers.user.password);
    await expect(page).toHaveURL('/invoices');
  });

  test('should handle rate limiting', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.fill('[name="email"]', testUsers.user.email);
      await page.fill('[name="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    await expect(page.locator('.error-message')).toContainText('Too many attempts');
  });

  test('should show loading state during login', async ({ page }) => {
    await page.fill('[name="email"]', testUsers.user.email);
    await page.fill('[name="password"]', testUsers.user.password);
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText(/logging in|loading/i);
  });
});

test.describe('Session Management', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('should maintain session across page reloads', async ({ page }) => {
    await authHelper.loginAsUser();
    
    await page.reload();
    await authHelper.verifyLoggedIn();
  });

  test('should logout on session expiry', async ({ page, context }) => {
    await authHelper.loginAsUser();
    
    await context.clearCookies();
    await page.reload();
    
    await expect(page).toHaveURL(/\/login/);
  });

  test('should refresh token automatically', async ({ page }) => {
    await authHelper.loginAsUser();
    
    await page.waitForTimeout(60000);
    
    await page.reload();
    await authHelper.verifyLoggedIn();
  });
});
