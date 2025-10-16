const express = require('express');
const router = express.Router();

router.get('/public', (req, res) => {
  res.json({
    stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key',
    paypalClientId: process.env.PAYPAL_CLIENT_ID || 'your_paypal_client_id',
  });
});

module.exports = router;
