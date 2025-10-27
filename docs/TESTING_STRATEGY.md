# Testing Strategy

## Overview

Comprehensive testing strategy for the Invoice SaaS platform, ensuring reliability, performance, and security at all levels.

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \
                 /--------\
                /Integration\
               /--------------\
              /  Unit Tests    \
             /------------------\
```

**Distribution**
- Unit Tests: 70%
- Integration Tests: 20%
- E2E Tests: 10%

## Test Categories

### Unit Tests

**Scope**: Individual functions and components

**Framework**: Jest, React Testing Library

**Coverage Requirements**
- Minimum: 80% overall
- Critical paths: 95%
- New code: 90%

**Example**
```typescript
describe('InvoiceService', () => {
  describe('calculateTotal', () => {
    it('should calculate total with tax', () => {
      const items = [{ quantity: 2, price: 100 }];
      const total = calculateTotal(items, 0.1);
      expect(total).toBe(220);
    });
    
    it('should handle empty items', () => {
      expect(calculateTotal([], 0.1)).toBe(0);
    });
  });
});
```

**Run Command**
```bash
pnpm run test:unit
pnpm run test:unit:watch
pnpm run test:unit:coverage
```

### Integration Tests

**Scope**: API endpoints, database interactions, service integrations

**Framework**: Jest, Supertest

**Requirements**
- Test database fixtures
- Mock external services
- Test authentication flows
- Validate data persistence

**Example**
```typescript
describe('POST /api/invoices', () => {
  it('should create invoice with valid data', async () => {
    const response = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientName: 'Test Client',
        amount: 1000,
        currency: 'USD',
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

**Run Command**
```bash
pnpm run test:integration
```

### E2E Tests

**Scope**: Complete user workflows

**Framework**: Playwright

**Critical Flows**
- User registration and login
- Invoice creation and management
- Payment processing
- PDF generation and download
- Email notifications

**Example**
```typescript
test('complete invoice workflow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  
  await page.waitForURL('/dashboard');
  await page.click('text=Create Invoice');
  
  await page.fill('[name=clientName]', 'Test Client');
  await page.fill('[name=amount]', '1000');
  await page.click('text=Create');
  
  await expect(page.locator('text=Invoice created')).toBeVisible();
});
```

**Run Command**
```bash
pnpm run test:e2e
pnpm run test:e2e:ui
```

## Performance Testing

### Load Testing

**Tool**: k6

**Scenarios**
1. **Baseline Load**
   - Users: 100 concurrent
   - Duration: 10 minutes
   - Expected: < 500ms p95

2. **Peak Load**
   - Users: 1,000 concurrent
   - Duration: 5 minutes
   - Expected: < 1s p95

3. **Stress Test**
   - Ramp up to 10,000 users
   - Duration: 30 minutes
   - Measure breaking point

**Example Script**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://api.invoice-saas.com/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

**Run Command**
```bash
k6 run scripts/load-test.js
k6 run --vus 100 --duration 10m scripts/load-test.js
```

### Soak Testing

**Purpose**: Detect memory leaks and resource exhaustion

**Configuration**
- Duration: 24 hours
- Load: 50% of peak capacity
- Monitoring: Memory, CPU, connections

## Security Testing

### SAST (Static Application Security Testing)

**Tools**
- CodeQL: Code vulnerability scanning
- ESLint Security Plugin: Security linting
- npm audit: Dependency scanning

**Run Command**
```bash
pnpm audit
npx eslint --ext .ts,.tsx src/ --config .eslintrc.security.json
```

### DAST (Dynamic Application Security Testing)

**Tools**
- OWASP ZAP: Automated security testing
- Burp Suite: Manual penetration testing

**Tests**
- SQL injection
- XSS attacks
- CSRF vulnerabilities
- Authentication bypass
- Authorization flaws

**Schedule**: Quarterly

### Dependency Scanning

**Tools**
- Dependabot: Automated updates
- Snyk: Vulnerability monitoring
- Trivy: Container scanning

**Process**
- Daily scans
- Auto-create PRs for patches
- Manual review for major versions

## Contract Testing

**Purpose**: Ensure API compatibility between services

**Tool**: Pact

**Example**
```typescript
describe('Invoice Service Contract', () => {
  it('should provide invoice data', async () => {
    const provider = new Pact({
      consumer: 'web-app',
      provider: 'invoice-service',
    });
    
    await provider
      .addInteraction({
        state: 'invoice exists',
        uponReceiving: 'a request for invoice',
        withRequest: {
          method: 'GET',
          path: '/api/invoices/123',
        },
        willRespondWith: {
          status: 200,
          body: {
            id: '123',
            amount: 1000,
          },
        },
      })
      .verify();
  });
});
```

## Accessibility Testing

**Standards**: WCAG 2.1 Level AA

**Tools**
- axe-core: Automated testing
- Lighthouse: Performance and accessibility
- Manual testing: Screen readers

**Checks**
- Keyboard navigation
- Color contrast
- Alt text for images
- ARIA labels
- Focus management

**Run Command**
```bash
pnpm run test:a11y
npx lighthouse https://invoice-saas.com --preset=accessibility
```

## Test Data Management

### Test Fixtures

**Location**: `tests/fixtures/`

**Categories**
- Users: Sample user accounts
- Invoices: Various invoice states
- Payments: Payment scenarios

**Example**
```typescript
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Test123!',
    role: 'admin',
  },
  user: {
    email: 'user@test.com',
    password: 'Test123!',
    role: 'user',
  },
};
```

### Database Seeding

**Development**
```bash
pnpm --filter @invoice-saas/invoice-service prisma:seed
```

**Testing**
```bash
pnpm --filter @invoice-saas/invoice-service prisma:seed:test
```

## CI/CD Integration

### Pre-Commit

```yaml
# .husky/pre-commit
pnpm run lint
pnpm run typecheck
pnpm run test:unit --bail
```

### Pull Request

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    pnpm run test:unit
    pnpm run test:integration
    pnpm run test:e2e
    pnpm run test:coverage
```

### Pre-Deploy

```yaml
# .github/workflows/deploy.yml
- name: Smoke tests
  run: |
    pnpm run test:e2e:critical
    pnpm run test:load:quick
```

### Post-Deploy

```yaml
# .github/workflows/post-deploy.yml
- name: Verify deployment
  run: |
    curl https://api.invoice-saas.com/health
    pnpm run test:smoke
```

## Test Environments

### Local Development

**Setup**
```bash
docker-compose up -d
pnpm --filter @invoice-saas/invoice-service prisma:migrate:dev
pnpm dev
```

**Characteristics**
- Isolated database
- Mock external services
- Fast feedback loop

### CI Environment

**Characteristics**
- Fresh database per run
- Parallel test execution
- Full test suite

### Staging

**Characteristics**
- Production-like environment
- Real integrations (test mode)
- Full E2E testing

**URL**: https://staging.invoice-saas.com

### Production

**Testing**
- Synthetic monitoring
- Health checks
- Canary deployments

## Test Reporting

### Coverage Reports

**Generated**: After each test run

**Location**: `coverage/`

**Formats**
- HTML: `coverage/lcov-report/index.html`
- JSON: `coverage/coverage-final.json`
- LCOV: `coverage/lcov.info`

**Upload**: Codecov, Coveralls

### Test Results

**Format**: JUnit XML

**Integration**
- GitHub Actions: Automatic
- Local: `pnpm run test:report`

### Metrics Tracked

- Test count
- Pass/fail rate
- Execution time
- Flaky tests
- Coverage trends

## Best Practices

### Writing Tests

**Do**
- Follow AAA pattern (Arrange, Act, Assert)
- Test one thing per test
- Use descriptive names
- Keep tests independent
- Mock external dependencies
- Use test fixtures

**Don't**
- Test implementation details
- Write brittle tests
- Depend on test order
- Use real external services
- Ignore flaky tests

### Test Maintenance

- Review and update fixtures regularly
- Remove obsolete tests
- Refactor duplicated test code
- Update mocks when APIs change
- Monitor test execution time

## Resources

- [Contributing Guide](../CONTRIBUTING.md)
- [API Documentation](../API_DOCUMENTATION.md)
- [CI/CD Pipeline](.github/workflows/)
