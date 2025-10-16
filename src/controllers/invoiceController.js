const Invoice = require('../models/Invoice');
const SecureToken = require('../models/SecureToken');

async function createInvoice(req, res) {
  try {
    const { client_name, client_email, amount, currency, description } = req.body;

    if (!client_name || !client_email || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const invoice = Invoice.create({
      client_name,
      client_email,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      description,
    });

    const token = SecureToken.create(invoice.id);

    res.status(201).json({
      invoice,
      token,
      portal_url: `${process.env.BASE_URL}/portal?token=${token}`,
    });
  } catch (error) {
    console.error('Create Invoice Error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
}

async function getInvoiceByToken(req, res) {
  try {
    const { token } = req.params;

    if (!SecureToken.validate(token)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const invoice = Invoice.findByToken(token);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const payments = Invoice.getPayments(invoice.id);

    res.json({
      invoice,
      payments,
    });
  } catch (error) {
    console.error('Get Invoice Error:', error);
    res.status(500).json({ error: 'Failed to retrieve invoice' });
  }
}

module.exports = {
  createInvoice,
  getInvoiceByToken,
};
