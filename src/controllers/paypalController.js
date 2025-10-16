const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const SecureToken = require('../models/SecureToken');
const { createOrder, captureOrder, getOrder } = require('../utils/paypal');

async function createPayPalOrder(req, res) {
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

    const order = await createOrder({
      invoiceId: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
    });

    Payment.create({
      invoice_id: invoice.id,
      provider: 'paypal',
      transaction_id: order.id,
      amount: invoice.amount,
      status: 'pending',
      metadata: { order_id: order.id },
    });

    res.json({ orderId: order.id });
  } catch (error) {
    console.error('Create PayPal Order Error:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
}

async function capturePayPalOrder(req, res) {
  try {
    const { orderId } = req.body;

    const capture = await captureOrder(orderId);

    const payment = Payment.findByTransactionId(orderId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (capture.status === 'COMPLETED') {
      Payment.updateStatus(payment.id, 'completed');
      Invoice.updateStatus(payment.invoice_id, 'paid');

      res.json({ 
        status: 'success',
        capture,
      });
    } else {
      Payment.updateStatus(payment.id, 'failed');
      res.status(400).json({ error: 'Payment capture failed', capture });
    }
  } catch (error) {
    console.error('Capture PayPal Order Error:', error);
    res.status(500).json({ error: 'Failed to capture PayPal order' });
  }
}

module.exports = {
  createPayPalOrder,
  capturePayPalOrder,
};
