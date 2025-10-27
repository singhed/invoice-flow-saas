# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT Bearer tokens.

```bash
Authorization: Bearer <access_token>
```

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:** 201 Created
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGc..."
}
```

### POST /auth/login
Authenticate and receive access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** 200 OK
```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** 200 OK
```json
{
  "token": "eyJhbGc...",
  "expiresIn": 900
}
```

### POST /auth/logout
Logout and invalidate refresh token.

**Response:** 204 No Content

### GET /auth/me
Get current user profile.

**Response:** 200 OK
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## Invoice Endpoints

### POST /invoices
Create a new invoice.

**Request:**
```json
{
  "clientName": "Acme Corp",
  "clientEmail": "billing@acme.com",
  "amount": 1000.00,
  "currency": "USD",
  "dueDate": "2024-12-31",
  "description": "Consulting services",
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unitPrice": 100.00
    }
  ]
}
```

**Response:** 201 Created
```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2024-001",
  "clientName": "Acme Corp",
  "clientEmail": "billing@acme.com",
  "amount": 1000.00,
  "currency": "USD",
  "status": "draft",
  "dueDate": "2024-12-31",
  "createdAt": "2024-01-15T10:00:00Z",
  "pdfUrl": "https://s3.amazonaws.com/..."
}
```

### GET /invoices
List all invoices.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (draft, sent, paid, overdue, cancelled)
- `search` (optional): Search by client name or invoice number

**Response:** 200 OK
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2024-001",
      "clientName": "Acme Corp",
      "amount": 1000.00,
      "status": "draft",
      "dueDate": "2024-12-31",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### GET /invoices/:id
Get a specific invoice.

**Response:** 200 OK
```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2024-001",
  "clientName": "Acme Corp",
  "clientEmail": "billing@acme.com",
  "amount": 1000.00,
  "currency": "USD",
  "status": "draft",
  "dueDate": "2024-12-31",
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unitPrice": 100.00,
      "total": 1000.00
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "pdfUrl": "https://s3.amazonaws.com/..."
}
```

### PUT /invoices/:id
Update an invoice.

**Request:**
```json
{
  "clientName": "Acme Corporation",
  "amount": 1200.00,
  "status": "sent"
}
```

**Response:** 200 OK
Returns updated invoice object.

### DELETE /invoices/:id
Delete an invoice.

**Response:** 204 No Content

### POST /invoices/:id/send
Send invoice via email.

**Request:**
```json
{
  "recipientEmail": "billing@acme.com",
  "message": "Please find attached invoice for services rendered."
}
```

**Response:** 200 OK
```json
{
  "status": "sent",
  "sentAt": "2024-01-15T10:00:00Z",
  "recipientEmail": "billing@acme.com"
}
```

### GET /invoices/:id/pdf
Download invoice PDF.

**Response:** 200 OK
Returns PDF file with appropriate Content-Type header.

## Payment Endpoints

### POST /payments
Record a payment.

**Request:**
```json
{
  "invoiceId": "uuid",
  "amount": 1000.00,
  "paymentMethod": "credit_card",
  "transactionId": "ch_1234567890"
}
```

**Response:** 201 Created
```json
{
  "id": "uuid",
  "invoiceId": "uuid",
  "amount": 1000.00,
  "paymentMethod": "credit_card",
  "transactionId": "ch_1234567890",
  "status": "completed",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### GET /payments
List all payments.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `invoiceId` (optional): Filter by invoice ID

**Response:** 200 OK
```json
{
  "payments": [
    {
      "id": "uuid",
      "invoiceId": "uuid",
      "amount": 1000.00,
      "status": "completed",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

## Analytics Endpoints

### GET /analytics/dashboard
Get dashboard metrics.

**Response:** 200 OK
```json
{
  "totalRevenue": 50000.00,
  "totalInvoices": 150,
  "paidInvoices": 120,
  "pendingAmount": 15000.00,
  "overdueAmount": 5000.00,
  "revenueByMonth": [
    { "month": "2024-01", "revenue": 10000.00 },
    { "month": "2024-02", "revenue": 12000.00 }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
Invalid request parameters or validation errors.

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
Missing or invalid authentication token.

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
Insufficient permissions.

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
Resource not found.

```json
{
  "error": "Not Found",
  "message": "Invoice not found"
}
```

### 429 Too Many Requests
Rate limit exceeded.

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

### 500 Internal Server Error
Server error.

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

- Global: 100 requests per 15 minutes per IP
- Auth endpoints: 10 requests per 15 minutes per IP + email combination

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Timestamp when limit resets

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (starts at 1)
- `limit`: Items per page (max 100)

Paginated responses include:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

## API Versioning

The API is versioned via the URL path. Current version is v1.

Future versions will be accessible at `/api/v2`, etc.
