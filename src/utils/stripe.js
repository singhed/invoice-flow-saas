const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession({ invoiceId, amount, currency, description, successUrl, cancelUrl, metadata = {} }) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Invoice Payment',
            description: description || 'Payment for invoice',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      invoice_id: invoiceId,
      ...metadata,
    },
  });

  return session;
}

async function constructWebhookEvent(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

module.exports = {
  stripe,
  createCheckoutSession,
  constructWebhookEvent,
};
