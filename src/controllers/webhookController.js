const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { constructWebhookEvent } = require('../utils/stripe');

async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = await constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session completed:', session.id);

  const invoiceId = session.metadata.invoice_id;
  
  if (!invoiceId) {
    console.error('No invoice_id in session metadata');
    return;
  }

  const payment = Payment.findByPaymentIntentId(session.payment_intent);
  
  if (payment) {
    Payment.updateStatus(payment.id, 'completed');
    Invoice.updateStatus(invoiceId, 'paid');
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  const payment = Payment.findByPaymentIntentId(paymentIntent.id);
  
  if (payment) {
    Payment.updateStatus(payment.id, 'completed');
    Invoice.updateStatus(payment.invoice_id, 'paid');
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);

  const payment = Payment.findByPaymentIntentId(paymentIntent.id);
  
  if (payment) {
    Payment.updateStatus(payment.id, 'failed');
  }
}

async function handlePayPalWebhook(req, res) {
  try {
    const webhookEvent = req.body;

    console.log('PayPal webhook received:', webhookEvent.event_type);

    switch (webhookEvent.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePayPalPaymentCaptured(webhookEvent.resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePayPalPaymentFailed(webhookEvent.resource);
        break;
      default:
        console.log(`Unhandled PayPal event type ${webhookEvent.event_type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handlePayPalPaymentCaptured(resource) {
  console.log('PayPal payment captured:', resource.id);

  const orderId = resource.supplementary_data?.related_ids?.order_id;
  
  if (!orderId) {
    console.error('No order_id in PayPal webhook');
    return;
  }

  const payment = Payment.findByTransactionId(orderId);
  
  if (payment) {
    Payment.updateStatus(payment.id, 'completed');
    Invoice.updateStatus(payment.invoice_id, 'paid');
  }
}

async function handlePayPalPaymentFailed(resource) {
  console.log('PayPal payment failed:', resource.id);

  const orderId = resource.supplementary_data?.related_ids?.order_id;
  
  if (!orderId) {
    console.error('No order_id in PayPal webhook');
    return;
  }

  const payment = Payment.findByTransactionId(orderId);
  
  if (payment) {
    Payment.updateStatus(payment.id, 'failed');
  }
}

module.exports = {
  handleStripeWebhook,
  handlePayPalWebhook,
};
