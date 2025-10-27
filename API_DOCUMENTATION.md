# API Reference

Base URL: `http://localhost:3000/api`

## Authentication

Endpoints require JWT Bearer tokens in the Authorization header.

```
Authorization: Bearer <access_token>
```

## Auth

### POST /auth/register

Create new user account.

**Request**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response** `201`
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

Authenticate user.

**Request**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** `200`
```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900
}
```

### POST /auth/refresh

Refresh access token.

**Request**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** `200`
```json
{
  "token": "eyJhbGc...",
  "expiresIn": 900
}
```

### POST /auth/logout

Invalidate refresh token.

**Response** `204`

### GET /auth/me

Get current user.

**Response** `200`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## Invoices

### POST /invoices

Create invoice.

**Request**
```json
{
  "clientName": "Acme Corp",
  "clientEmail": "billing@acme.com",
  "amount": 1000.00,
  "currency": "USD",
  "dueDate": "2024-12-31",
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unitPrice": 100.00
    }
  ]
}
```

**Response** `201`
```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2024-001",
  "clientName": "Acme Corp",
  "amount": 1000.00,
  "status": "draft",
  "pdfUrl": "https://s3.amazonaws.com/..."
}
```

### GET /invoices

List invoices.

**Parameters**
- `page` Page number (default: 1)
- `limit` Items per page (default: 20, max: 100)
- `status` Filter by status
- `search` Search by client or invoice number

**Response** `200`
```json
{
  "invoices": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### GET /invoices/:id

Get invoice details.

**Response** `200`
```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2024-001",
  "clientName": "Acme Corp",
  "amount": 1000.00,
  "items": [...],
  "pdfUrl": "https://s3.amazonaws.com/..."
}
```

### PUT /invoices/:id

Update invoice.

**Request**
```json
{
  "clientName": "Acme Corporation",
  "amount": 1200.00,
  "status": "sent"
}
```

**Response** `200`

### DELETE /invoices/:id

Delete invoice.

**Response** `204`

### POST /invoices/:id/send

Send invoice via email.

**Request**
```json
{
  "recipientEmail": "billing@acme.com",
  "message": "Please find attached invoice."
}
```

**Response** `200`
```json
{
  "status": "sent",
  "sentAt": "2024-01-15T10:00:00Z"
}
```

### GET /invoices/:id/pdf

Download PDF.

**Response** `200` (application/pdf)

## Payments

### POST /payments

Record payment.

**Request**
```json
{
  "invoiceId": "uuid",
  "amount": 1000.00,
  "paymentMethod": "credit_card",
  "transactionId": "ch_1234567890"
}
```

**Response** `201`
```json
{
  "id": "uuid",
  "amount": 1000.00,
  "status": "completed",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### GET /payments

List payments.

**Parameters**
- `page` Page number
- `limit` Items per page
- `invoiceId` Filter by invoice

**Response** `200`
```json
{
  "payments": [...],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 2
  }
}
```

## Analytics

### GET /analytics/dashboard

Dashboard metrics.

**Response** `200`
```json
{
  "totalRevenue": 50000.00,
  "totalInvoices": 150,
  "paidInvoices": 120,
  "pendingAmount": 15000.00,
  "overdueAmount": 5000.00,
  "revenueByMonth": [
    { "month": "2024-01", "revenue": 10000.00 }
  ]
}
```

## Errors

Standard HTTP status codes with structured error responses.

**400 Bad Request**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid format" }
  ]
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

**404 Not Found**
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

**429 Too Many Requests**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "message": "Unexpected error occurred"
}
```

## Rate Limits

- Global: 100 requests per 15 minutes
- Auth: 10 requests per 15 minutes

**Headers**
- `X-RateLimit-Limit` Maximum allowed
- `X-RateLimit-Remaining` Requests remaining
- `X-RateLimit-Reset` Reset timestamp

## Pagination

**Parameters**
- `page` Page number (starts at 1)
- `limit` Items per page (max 100)

**Response**
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
