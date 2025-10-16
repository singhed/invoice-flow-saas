# Payment Portal - Stripe & PayPal Integration

A complete payment integration system with Express backend, Stripe Checkout Sessions, and PayPal Orders. Features a client-facing payment portal with secure token-based authentication, invoice management, and webhook handlers for payment processing.

## Features

- **Dual Payment Processing**: Support for both Stripe and PayPal payments
- **Secure Client Portal**: Token-based authentication for invoice access
- **Webhook Integration**: Real-time payment status updates via webhooks
- **Invoice Management**: Create, track, and manage invoices with payment history
- **Responsive UI**: Modern, mobile-friendly payment portal interface
- **Transaction Records**: Persistent storage of payment intents and transactions

## Tech Stack

- **Backend**: Express.js
- **Database**: SQLite with better-sqlite3
- **Payment Providers**: 
  - Stripe Checkout Sessions
  - PayPal Orders API
- **Frontend**: Vanilla JavaScript with Stripe.js and PayPal SDK

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your actual API keys:
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret
- `PAYPAL_CLIENT_ID`: Your PayPal client ID
- `PAYPAL_CLIENT_SECRET`: Your PayPal client secret
- `BASE_URL`: Your application base URL

4. Create the data directory:
```bash
mkdir data
```

5. Start the server:
```bash
npm start
```

## API Endpoints

### Invoices

#### Create Invoice
```
POST /api/invoices
Content-Type: application/json

{
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "amount": 100.00,
  "currency": "USD",
  "description": "Service payment"
}

Response:
{
  "invoice": {...},
  "token": "secure_token_here",
  "portal_url": "http://localhost:3000/portal?token=secure_token_here"
}
```

#### Get Invoice by Token
```
GET /api/invoices/:token

Response:
{
  "invoice": {...},
  "payments": [...]
}
```

### Payments

#### Create Stripe Checkout Session
```
POST /api/payments/stripe/create-session
Content-Type: application/json

{
  "token": "invoice_token"
}

Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### Create PayPal Order
```
POST /api/payments/paypal/create-order
Content-Type: application/json

{
  "token": "invoice_token"
}

Response:
{
  "orderId": "paypal_order_id"
}
```

#### Capture PayPal Order
```
POST /api/payments/paypal/capture-order
Content-Type: application/json

{
  "orderId": "paypal_order_id"
}

Response:
{
  "status": "success",
  "capture": {...}
}
```

### Webhooks

#### Stripe Webhook
```
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: signature_header

Handles events:
- checkout.session.completed
- payment_intent.succeeded
- payment_intent.payment_failed
```

#### PayPal Webhook
```
POST /api/webhooks/paypal
Content-Type: application/json

Handles events:
- PAYMENT.CAPTURE.COMPLETED
- PAYMENT.CAPTURE.DENIED
- PAYMENT.CAPTURE.REFUNDED
```

## Client Portal

Access the payment portal at: `http://localhost:3000/portal?token=YOUR_TOKEN`

The portal displays:
- Invoice details (client info, amount, description)
- Payment status badge
- Stripe payment button
- PayPal payment buttons
- Payment history

## Webhook Setup

### Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### PayPal Webhooks

1. Go to PayPal Developer Dashboard → Apps & Credentials
2. Select your app → Add Webhook
3. Webhook URL: `https://your-domain.com/api/webhooks/paypal`
4. Subscribe to events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

## Database Schema

### invoices
- id (TEXT, PRIMARY KEY)
- client_name (TEXT)
- client_email (TEXT)
- amount (REAL)
- currency (TEXT)
- status (TEXT: pending, paid, failed)
- description (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

### payments
- id (TEXT, PRIMARY KEY)
- invoice_id (TEXT, FOREIGN KEY)
- provider (TEXT: stripe, paypal)
- payment_intent_id (TEXT)
- transaction_id (TEXT)
- status (TEXT: pending, completed, failed)
- amount (REAL)
- metadata (TEXT/JSON)
- created_at (DATETIME)
- updated_at (DATETIME)

### secure_tokens
- id (TEXT, PRIMARY KEY)
- invoice_id (TEXT, FOREIGN KEY)
- token (TEXT, UNIQUE)
- expires_at (DATETIME)
- created_at (DATETIME)

## Development

### Running in Development Mode
```bash
npm start
```

### Testing Webhooks Locally

Use a tool like ngrok to expose your local server:
```bash
ngrok http 3000
```

Then use the ngrok URL for webhook configuration.

## Security Considerations

- Tokens expire after 30 days by default
- Webhook signatures are verified
- All payment data is processed securely through provider SDKs
- Sensitive API keys stored in environment variables
- Raw body parsing for Stripe webhook signature verification

## License

ISC
