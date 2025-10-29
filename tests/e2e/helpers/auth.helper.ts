/**
 * Authentication Helper
 * Utility functions for authentication in E2E tests
 */

import { Page, expect } from '@playwright/test';
import { testUsers, apiEndpoints } from '../fixtures/test-data';

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Register a new user
   */
  async register(userData = testUsers.newUser) {
    await this.page.goto('/register');
    
    await this.page.fill('[name="email"]', userData.email);
    await this.page.fill('[name="password"]', userData.password);
    await this.page.fill('[name="name"]', userData.name);
    
    await this.page.click('button[type="submit"]');
    
    await expect(this.page).toHaveURL('/dashboard', { timeout: 10000 });
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string) {
    await this.page.goto('/login');
    
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    
    await this.page.click('button[type="submit"]');
    
    await expect(this.page).toHaveURL('/dashboard', { timeout: 10000 });
  }

  /**
   * Login as test user
   */
  async loginAsUser() {
    await this.login(testUsers.user.email, testUsers.user.password);
  }

  /**
   * Login as admin
   */
  async loginAsAdmin() {
    await this.login(testUsers.admin.email, testUsers.admin.password);
  }

  /**
   * Logout
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    
    await expect(this.page).toHaveURL('/login', { timeout: 5000 });
  }

  /**
   * Get auth token via API
   */
  async getAuthToken(email: string, password: string): Promise<string> {
    const response = await this.page.request.post(apiEndpoints.auth.login, {
      data: { email, password },
    });
    
    const data = await response.json();
    return data.token;
  }

  /**
   * Setup authenticated session via API (faster than UI)
   */
  async setupAuthenticatedSession() {
    const token = await this.getAuthToken(
      testUsers.user.email,
      testUsers.user.password
    );
    
    await this.page.context().addCookies([
      {
        name: 'auth_token',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ]);
  }

  /**
   * Verify user is logged in
   */
  async verifyLoggedIn() {
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  /**
   * Verify user is logged out
   */
  async verifyLoggedOut() {
    await expect(this.page).toHaveURL(/\/(login|register)/);
  }
}
