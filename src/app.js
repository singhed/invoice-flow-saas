const express = require('express');
const path = require('path');
require('dotenv').config();

const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');
const configRoutes = require('./routes/config');

const app = express();

app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/config', configRoutes);

app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/portal.html'));
});

app.get('/portal/success', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/success.html'));
});

app.get('/portal/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cancel.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
