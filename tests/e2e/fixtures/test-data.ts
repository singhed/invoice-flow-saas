/**
 * Test Data Fixtures
 * Centralized test data for E2E tests
 */

export const testUsers = {
  admin: {
    email: 'admin@test.invoice-saas.com',
    password: 'AdminTest123!',
    name: 'Admin User',
    role: 'admin',
  },
  user: {
    email: 'user@test.invoice-saas.com',
    password: 'UserTest123!',
    name: 'Test User',
    role: 'user',
  },
  newUser: {
    email: `test-${Date.now()}@invoice-saas.com`,
    password: 'NewUser123!',
    name: 'New Test User',
  },
};

export const testInvoices = {
  basic: {
    clientName: 'Acme Corporation',
    clientEmail: 'billing@acme.com',
    amount: 1000.00,
    currency: 'USD',
    dueDate: '2024-12-31',
    description: 'Professional Services',
  },
  withItems: {
    clientName: 'TechCorp Inc',
    clientEmail: 'accounts@techcorp.com',
    amount: 2500.00,
    currency: 'USD',
    dueDate: '2024-12-15',
    items: [
      {
        description: 'Consulting Services',
        quantity: 10,
        unitPrice: 150.00,
      },
      {
        description: 'Development Hours',
        quantity: 20,
        unitPrice: 100.00,
      },
    ],
  },
  recurring: {
    clientName: 'Global Solutions Ltd',
    clientEmail: 'finance@globalsolutions.com',
    amount: 5000.00,
    currency: 'USD',
    recurring: true,
    frequency: 'monthly',
  },
};

export const testPayments = {
  creditCard: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    zip: '10001',
  },
  testCard: {
    number: '5555555555554444',
    expiry: '03/26',
    cvc: '456',
    zip: '94105',
  },
};

export const apiEndpoints = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
  },
  invoices: {
    list: '/api/invoices',
    create: '/api/invoices',
    get: (id: string) => `/api/invoices/${id}`,
    update: (id: string) => `/api/invoices/${id}`,
    delete: (id: string) => `/api/invoices/${id}`,
    send: (id: string) => `/api/invoices/${id}/send`,
    pdf: (id: string) => `/api/invoices/${id}/pdf`,
  },
  payments: {
    list: '/api/payments',
    create: '/api/payments',
    get: (id: string) => `/api/payments/${id}`,
  },
};

export const testTimeouts = {
  short: 5000,
  medium: 10000,
  long: 30000,
  veryLong: 60000,
};

export const errorMessages = {
  invalidEmail: 'Invalid email format',
  passwordTooShort: 'Password must be at least 8 characters',
  requiredField: 'This field is required',
  invalidAmount: 'Amount must be greater than 0',
  unauthorized: 'Unauthorized',
  notFound: 'Not found',
};
