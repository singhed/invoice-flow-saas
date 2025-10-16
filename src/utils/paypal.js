const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
  }
}

function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

async function createOrder({ invoiceId, amount, currency, description }) {
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2),
        },
        description: description || 'Invoice Payment',
        custom_id: invoiceId,
      },
    ],
    application_context: {
      brand_name: 'Invoice Payment Portal',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${process.env.BASE_URL}/portal/success`,
      cancel_url: `${process.env.BASE_URL}/portal/cancel`,
    },
  });

  try {
    const order = await client().execute(request);
    return order.result;
  } catch (err) {
    console.error('PayPal Create Order Error:', err);
    throw err;
  }
}

async function captureOrder(orderId) {
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
  request.prefer("return=representation");

  try {
    const capture = await client().execute(request);
    return capture.result;
  } catch (err) {
    console.error('PayPal Capture Order Error:', err);
    throw err;
  }
}

async function getOrder(orderId) {
  const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);

  try {
    const order = await client().execute(request);
    return order.result;
  } catch (err) {
    console.error('PayPal Get Order Error:', err);
    throw err;
  }
}

module.exports = {
  createOrder,
  captureOrder,
  getOrder,
};
