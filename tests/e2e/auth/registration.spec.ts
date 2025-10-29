/**
 * User Registration E2E Tests
 * Tests for user registration flow
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { testUsers, errorMessages } from '../fixtures/test-data';

test.describe('User Registration', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await page.goto('/register');
  });

  test('should register new user successfully', async ({ page }) => {
    const newUser = {
      email: `test-${Date.now()}@invoice-saas.com`,
      password: 'NewUser123!',
      name: 'New Test User',
    };

    await page.fill('[name="email"]', newUser.email);
    await page.fill('[name="password"]', newUser.password);
    await page.fill('[name="name"]', newUser.name);
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="name"]', 'Test User');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText(errorMessages.invalidEmail);
  });

  test('should show error for weak password', async ({ page }) => {
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', '123');
    await page.fill('[name="name"]', 'Test User');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText(errorMessages.passwordTooShort);
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.fill('[name="email"]', testUsers.user.email);
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="name"]', 'Test User');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText('already exists');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('[data-testid="login-link"]');
    await expect(page).toHaveURL('/login');
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    const errors = page.locator('.error-message');
    await expect(errors).toHaveCount(3);
  });

  test('should show/hide password', async ({ page }) => {
    const passwordInput = page.locator('[name="password"]');
    await passwordInput.fill('TestPassword123!');
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    await page.click('[data-testid="toggle-password"]');
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    await page.click('[data-testid="toggle-password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should validate password strength', async ({ page }) => {
    const passwordInput = page.locator('[name="password"]');
    const strengthIndicator = page.locator('[data-testid="password-strength"]');
    
    await passwordInput.fill('weak');
    await expect(strengthIndicator).toHaveClass(/weak/);
    
    await passwordInput.fill('Medium123');
    await expect(strengthIndicator).toHaveClass(/medium/);
    
    await passwordInput.fill('Strong123!@#');
    await expect(strengthIndicator).toHaveClass(/strong/);
  });
});
