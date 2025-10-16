const express = require('express');
const router = express.Router();
const { createStripeSession } = require('../controllers/stripeController');
const { createPayPalOrder, capturePayPalOrder } = require('../controllers/paypalController');

router.post('/stripe/create-session', createStripeSession);
router.post('/paypal/create-order', createPayPalOrder);
router.post('/paypal/capture-order', capturePayPalOrder);

module.exports = router;
