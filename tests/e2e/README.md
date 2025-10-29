# E2E Tests

Comprehensive end-to-end browser tests for the Invoice SaaS platform using Playwright.

## Overview

**Test Coverage**
- Authentication flows (registration, login, logout)
- Invoice management (create, edit, delete, send)
- Payment processing (credit card, refunds)
- Dashboard and analytics
- User profile management

**Browsers Tested**
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Quick Start

**Install Dependencies**
```bash
npm install @playwright/test
npx playwright install
```

**Run All Tests**
```bash
npx playwright test
```

**Run Specific Tests**
```bash
# Run auth tests only
npx playwright test tests/e2e/auth

# Run invoice tests
npx playwright test tests/e2e/invoice

# Run on specific browser
npx playwright test --project=chromium
```

**Interactive Mode**
```bash
npx playwright test --ui
```

**Debug Mode**
```bash
npx playwright test --debug
```

## Test Structure

```
tests/e2e/
├── auth/
│   ├── registration.spec.ts    User registration flows
│   └── login.spec.ts          Authentication tests
├── invoice/
│   ├── create-invoice.spec.ts  Invoice creation
│   ├── manage-invoice.spec.ts  CRUD operations
│   └── send-invoice.spec.ts    Email sending
├── payment/
│   └── process-payment.spec.ts Payment processing
├── dashboard/
│   └── dashboard.spec.ts      Dashboard and analytics
├── fixtures/
│   └── test-data.ts           Test data and fixtures
└── helpers/
    ├── auth.helper.ts         Authentication utilities
    └── invoice.helper.ts      Invoice utilities
```

## Running Tests

**Development**
```bash
# Run with UI
npx playwright test --ui

# Watch mode
npx playwright test --watch

# Specific file
npx playwright test tests/e2e/auth/login.spec.ts
```

**CI/CD**
```bash
# Headless mode with retries
npx playwright test --reporter=html,json,junit

# Generate reports
npx playwright show-report
```

**Parallel Execution**
```bash
# Run tests in parallel (default)
npx playwright test

# Set number of workers
npx playwright test --workers=4
```

## Test Data

**Fixtures**

Test data is centralized in `fixtures/test-data.ts`:
- User accounts (admin, regular user)
- Invoice templates
- Payment card details (test cards only)
- API endpoints

**Environment Variables**
```bash
BASE_URL=http://localhost:3000
CI=true
```

## Helpers

**AuthHelper**

Authentication utilities:
- `login(email, password)` - Login with credentials
- `loginAsUser()` - Login as test user
- `loginAsAdmin()` - Login as admin
- `logout()` - Logout current user
- `setupAuthenticatedSession()` - Fast API-based auth

**InvoiceHelper**

Invoice management utilities:
- `createInvoice(data)` - Create invoice via UI
- `createInvoiceWithItems(data)` - Create with line items
- `searchInvoice(term)` - Search invoices
- `filterByStatus(status)` - Filter by status
- `sendInvoice(email)` - Send invoice
- `downloadPDF()` - Download PDF
- `deleteInvoice()` - Delete invoice

## Best Practices

**Test Organization**
- Group related tests in describe blocks
- Use descriptive test names
- One assertion per test when possible
- Use page object helpers

**Performance**
- Use API for setup when possible
- Run tests in parallel
- Mock external services
- Use beforeEach for common setup

**Reliability**
- Wait for elements properly
- Use data-testid attributes
- Handle network delays
- Retry flaky tests

**Maintenance**
- Keep test data centralized
- Update selectors regularly
- Document complex flows
- Review failing tests

## Debugging

**Visual Debugging**
```bash
# Open test in browser
npx playwright test --debug

# Headed mode
npx playwright test --headed

# Slow motion
npx playwright test --headed --slowMo=1000
```

**Screenshots and Videos**
```bash
# Capture on failure (default)
npx playwright test

# Always capture
npx playwright test --screenshot=on --video=on
```

**Trace Viewer**
```bash
# Record trace
npx playwright test --trace=on

# View trace
npx playwright show-trace trace.zip
```

## Reports

**HTML Report**
```bash
npx playwright test --reporter=html
npx playwright show-report
```

**JSON Report**
```bash
npx playwright test --reporter=json
```

**JUnit XML**
```bash
npx playwright test --reporter=junit
```

## CI/CD Integration

**GitHub Actions**
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test

- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

**Test Matrix**
```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
```

## Troubleshooting

**Common Issues**

**Timeout Errors**
```typescript
// Increase timeout for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(60000);
  // test code
});
```

**Element Not Found**
```typescript
// Wait for element
await page.waitForSelector('[data-testid="element"]');

// Wait for network
await page.waitForLoadState('networkidle');
```

**Flaky Tests**
```typescript
// Add retries
test.describe.configure({ retries: 2 });

// Use soft assertions
await expect.soft(locator).toBeVisible();
```

## Performance Testing

**Load Testing with k6**
```bash
k6 run scripts/load-test.js
```

**Lighthouse Integration**
```bash
npx lighthouse http://localhost:3000 --output json html
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Testing Strategy](../../docs/TESTING_STRATEGY.md)
