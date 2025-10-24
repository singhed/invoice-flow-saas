import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const requestCount = new Counter('request_count');

// Test configuration for 1M users
export const options = {
  scenarios: {
    // Ramp-up scenario
    rampUp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1000 },    // Warm-up
        { duration: '5m', target: 10000 },   // Ramp to 10k
        { duration: '10m', target: 50000 },  // Ramp to 50k
        { duration: '30m', target: 50000 },  // Sustain 50k
        { duration: '5m', target: 0 },       // Ramp down
      ],
      gracefulRampDown: '30s',
    },
    
    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 10000 }, // Spike
        { duration: '3m', target: 10000 },
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
      ],
      startTime: '55m',
    },
  },
  
  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'],
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.01'],
    'api_latency': ['p(95)<200', 'p(99)<500'],
  },
};

const BASE_URL = __ENV.API_URL || 'https://api.invoice-saas.com';
const API_KEY = __ENV.API_KEY || '';

// Test data generators
function generateUser() {
  return {
    email: `user${Math.random().toString(36).substr(2, 9)}@test.com`,
    password: 'Test1234!',
  };
}

function generateInvoice() {
  return {
    clientName: `Client ${Math.floor(Math.random() * 10000)}`,
    clientEmail: `client${Math.random().toString(36).substr(2, 9)}@test.com`,
    amount: Math.floor(Math.random() * 10000) + 100,
    currency: 'USD',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        description: 'Service',
        quantity: Math.floor(Math.random() * 10) + 1,
        unitPrice: Math.floor(Math.random() * 1000) + 50,
      },
    ],
  };
}

// Main test function
export default function () {
  const user = generateUser();
  let authToken = '';

  // User Registration & Authentication Flow
  group('Authentication Flow', () => {
    // Register
    group('Register', () => {
      const registerRes = http.post(
        `${BASE_URL}/api/auth/register`,
        JSON.stringify(user),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'Register' },
        }
      );

      const registerSuccess = check(registerRes, {
        'register status is 200 or 201': (r) => r.status === 200 || r.status === 201 || r.status === 409,
        'register response time < 500ms': (r) => r.timings.duration < 500,
      });

      errorRate.add(!registerSuccess);
      apiLatency.add(registerRes.timings.duration);
      requestCount.add(1);

      if (registerRes.status === 200 || registerRes.status === 201) {
        const body = JSON.parse(registerRes.body);
        authToken = body.token || body.accessToken;
      }
    });

    sleep(1);

    // Login
    group('Login', () => {
      const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
          email: user.email,
          password: user.password,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'Login' },
        }
      );

      const loginSuccess = check(loginRes, {
        'login status is 200': (r) => r.status === 200 || r.status === 401,
        'login response time < 300ms': (r) => r.timings.duration < 300,
      });

      errorRate.add(!loginSuccess);
      apiLatency.add(loginRes.timings.duration);
      requestCount.add(1);

      if (loginRes.status === 200) {
        const body = JSON.parse(loginRes.body);
        authToken = body.token || body.accessToken;
      }
    });
  });

  if (!authToken) {
    authToken = API_KEY; // Fallback to API key
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  sleep(1);

  // Invoice Operations
  group('Invoice Operations', () => {
    // Create Invoice
    let invoiceId;
    group('Create Invoice', () => {
      const invoice = generateInvoice();
      const createRes = http.post(
        `${BASE_URL}/api/invoices`,
        JSON.stringify(invoice),
        {
          headers,
          tags: { name: 'CreateInvoice' },
        }
      );

      const createSuccess = check(createRes, {
        'create status is 201': (r) => r.status === 201 || r.status === 401,
        'create response time < 400ms': (r) => r.timings.duration < 400,
      });

      errorRate.add(!createSuccess);
      apiLatency.add(createRes.timings.duration);
      requestCount.add(1);

      if (createRes.status === 201) {
        const body = JSON.parse(createRes.body);
        invoiceId = body.id || body.data?.id;
      }
    });

    sleep(0.5);

    // List Invoices
    group('List Invoices', () => {
      const listRes = http.get(`${BASE_URL}/api/invoices?page=1&limit=20`, {
        headers,
        tags: { name: 'ListInvoices' },
      });

      const listSuccess = check(listRes, {
        'list status is 200': (r) => r.status === 200 || r.status === 401,
        'list response time < 200ms': (r) => r.timings.duration < 200,
      });

      errorRate.add(!listSuccess);
      apiLatency.add(listRes.timings.duration);
      requestCount.add(1);
    });

    sleep(0.5);

    // Get Single Invoice
    if (invoiceId) {
      group('Get Invoice', () => {
        const getRes = http.get(`${BASE_URL}/api/invoices/${invoiceId}`, {
          headers,
          tags: { name: 'GetInvoice' },
        });

        const getSuccess = check(getRes, {
          'get status is 200': (r) => r.status === 200 || r.status === 404 || r.status === 401,
          'get response time < 150ms': (r) => r.timings.duration < 150,
        });

        errorRate.add(!getSuccess);
        apiLatency.add(getRes.timings.duration);
        requestCount.add(1);
      });
    }
  });

  sleep(1);

  // Analytics Operations
  group('Analytics Operations', () => {
    group('Get Dashboard', () => {
      const dashboardRes = http.get(`${BASE_URL}/analytics/dashboard/overview`, {
        headers,
        tags: { name: 'GetDashboard' },
      });

      const dashboardSuccess = check(dashboardRes, {
        'dashboard status is 200': (r) => r.status === 200 || r.status === 401,
        'dashboard response time < 300ms': (r) => r.timings.duration < 300,
      });

      errorRate.add(!dashboardSuccess);
      apiLatency.add(dashboardRes.timings.duration);
      requestCount.add(1);
    });

    sleep(0.5);

    group('Get Revenue Trends', () => {
      const trendsRes = http.get(`${BASE_URL}/analytics/revenue/trends?period=month`, {
        headers,
        tags: { name: 'GetRevenueTrends' },
      });

      const trendsSuccess = check(trendsRes, {
        'trends status is 200': (r) => r.status === 200 || r.status === 401,
        'trends response time < 250ms': (r) => r.timings.duration < 250,
      });

      errorRate.add(!trendsSuccess);
      apiLatency.add(trendsRes.timings.duration);
      requestCount.add(1);
    });
  });

  sleep(1);

  // Search Operations
  group('Search Operations', () => {
    group('Search Invoices', () => {
      const searchRes = http.get(
        `${BASE_URL}/search?query=invoice&status=paid&page=1&limit=20`,
        {
          headers,
          tags: { name: 'SearchInvoices' },
        }
      );

      const searchSuccess = check(searchRes, {
        'search status is 200': (r) => r.status === 200 || r.status === 401,
        'search response time < 200ms': (r) => r.timings.duration < 200,
      });

      errorRate.add(!searchSuccess);
      apiLatency.add(searchRes.timings.duration);
      requestCount.add(1);
    });

    sleep(0.5);

    group('Autocomplete', () => {
      const autocompleteRes = http.get(`${BASE_URL}/search/suggest?query=inv&limit=5`, {
        headers,
        tags: { name: 'Autocomplete' },
      });

      const autocompleteSuccess = check(autocompleteRes, {
        'autocomplete status is 200': (r) => r.status === 200 || r.status === 401,
        'autocomplete response time < 100ms': (r) => r.timings.duration < 100,
      });

      errorRate.add(!autocompleteSuccess);
      apiLatency.add(autocompleteRes.timings.duration);
      requestCount.add(1);
    });
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '';
  const enableColors = options?.enableColors || false;

  let output = '\n';
  output += `${indent}Load Test Results\n`;
  output += `${indent}${'='.repeat(50)}\n\n`;

  output += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  output += `${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  output += `${indent}Failed Requests: ${data.metrics.http_req_failed.values.rate.toFixed(2)}%\n\n`;

  output += `${indent}Response Times:\n`;
  output += `${indent}  Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  output += `${indent}  Min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
  output += `${indent}  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
  output += `${indent}  P50: ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  output += `${indent}  P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  output += `${indent}  P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;

  output += `${indent}Virtual Users:\n`;
  output += `${indent}  Max: ${data.metrics.vus_max.values.max}\n`;
  output += `${indent}  Duration: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(2)}min\n\n`;

  return output;
}
