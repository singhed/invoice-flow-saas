const express = require('express');
const router = express.Router();
const { handleStripeWebhook, handlePayPalWebhook } = require('../controllers/webhookController');

router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
router.post('/paypal', handlePayPalWebhook);

module.exports = router;
