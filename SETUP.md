# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   - Get Stripe keys from: https://dashboard.stripe.com/test/apikeys
   - Get PayPal credentials from: https://developer.paypal.com/dashboard/

3. **Test Setup**
   ```bash
   node test-setup.js
   ```

4. **Start Server**
   ```bash
   npm start
   ```
   
   Server will run on http://localhost:3000

## Creating Your First Invoice

### Option 1: Using the Example Script

```bash
node examples/create-invoice.js
```

This will create a test invoice and return a payment portal URL.

### Option 2: Using cURL

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "amount": 100.00,
    "currency": "USD",
    "description": "Service Payment"
  }'
```

### Response

```json
{
  "invoice": {
    "id": "...",
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "amount": 100,
    "currency": "USD",
    "status": "pending",
    "description": "Service Payment"
  },
  "token": "secure_token_here",
  "portal_url": "http://localhost:3000/portal?token=secure_token_here"
}
```

## Testing Payments

### Stripe Test Cards

Use these test card numbers in Stripe Checkout:

- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

Any future expiry date and any 3-digit CVC will work.

### PayPal Sandbox

1. Create a PayPal Sandbox account at https://developer.paypal.com/
2. Use sandbox test accounts to complete payments
3. Sandbox buyer credentials can be found in your PayPal Developer Dashboard

## Setting Up Webhooks

### Stripe Webhooks (for production)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the signing secret and add it to `.env` as `STRIPE_WEBHOOK_SECRET`

### Testing Webhooks Locally

Use Stripe CLI or ngrok to test webhooks locally:

#### Using Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

#### Using ngrok:
```bash
ngrok http 3000
# Use the ngrok URL as your webhook endpoint
```

### PayPal Webhooks (for production)

1. Go to https://developer.paypal.com/dashboard/
2. Select your app
3. Click "Add Webhook"
4. Enter your webhook URL: `https://yourdomain.com/api/webhooks/paypal`
5. Subscribe to events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

## Project Structure

```
payment-portal/
├── src/
│   ├── routes/          # API route definitions
│   │   ├── invoices.js
│   │   ├── payments.js
│   │   ├── webhooks.js
│   │   └── config.js
│   ├── controllers/     # Request handlers
│   │   ├── invoiceController.js
│   │   ├── stripeController.js
│   │   ├── paypalController.js
│   │   └── webhookController.js
│   ├── models/          # Database models
│   │   ├── database.js
│   │   ├── Invoice.js
│   │   ├── Payment.js
│   │   └── SecureToken.js
│   ├── utils/           # Helper functions
│   │   ├── stripe.js
│   │   └── paypal.js
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── public/              # Static files
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── portal.js
│   ├── portal.html
│   ├── success.html
│   └── cancel.html
├── data/                # SQLite database (created automatically)
├── examples/            # Example scripts
│   └── create-invoice.js
├── .env                 # Environment variables (do not commit)
├── .env.example         # Environment template
├── package.json
└── README.md
```

## API Documentation

### Create Invoice
```
POST /api/invoices
```

### Get Invoice by Token
```
GET /api/invoices/:token
```

### Create Stripe Session
```
POST /api/payments/stripe/create-session
```

### Create PayPal Order
```
POST /api/payments/paypal/create-order
```

### Capture PayPal Order
```
POST /api/payments/paypal/capture-order
```

See README.md for detailed API documentation.

## Troubleshooting

### Database Issues
If you encounter database issues, delete the `data` directory and restart:
```bash
rm -rf data
npm start
```

### Port Already in Use
Change the port in `.env`:
```
PORT=3001
```

### Stripe/PayPal SDK Errors
Ensure your API keys are correctly set in `.env`

### Webhook Signature Verification Fails
Make sure the webhook secret matches your Stripe/PayPal dashboard settings

## Security Best Practices

1. **Never commit `.env` file** - It contains sensitive API keys
2. **Use HTTPS in production** - Required for Stripe/PayPal webhooks
3. **Validate webhook signatures** - Already implemented in the code
4. **Rotate tokens regularly** - Default expiry is 30 days
5. **Use environment-specific keys** - Test keys for development, live keys for production

## Next Steps

- Customize the portal UI to match your brand
- Add email notifications for invoice creation and payment confirmation
- Implement invoice generation (PDF)
- Add admin dashboard for invoice management
- Set up automated invoice reminders
- Implement refund handling
- Add multi-currency support
