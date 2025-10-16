const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const SecureToken = require('../models/SecureToken');
const { createCheckoutSession } = require('../utils/stripe');

async function createStripeSession(req, res) {
  try {
    const { token } = req.body;

    if (!SecureToken.validate(token)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const invoice = Invoice.findByToken(token);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    const session = await createCheckoutSession({
      invoiceId: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
      successUrl: `${process.env.BASE_URL}/portal/success?token=${token}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.BASE_URL}/portal?token=${token}`,
      metadata: {
        token,
      },
    });

    Payment.create({
      invoice_id: invoice.id,
      provider: 'stripe',
      payment_intent_id: session.payment_intent,
      amount: invoice.amount,
      status: 'pending',
      metadata: { session_id: session.id },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Create Stripe Session Error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
}

module.exports = {
  createStripeSession,
};
