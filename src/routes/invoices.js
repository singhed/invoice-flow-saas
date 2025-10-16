const express = require('express');
const router = express.Router();
const { createInvoice, getInvoiceByToken } = require('../controllers/invoiceController');

router.post('/', createInvoice);
router.get('/:token', getInvoiceByToken);

module.exports = router;
