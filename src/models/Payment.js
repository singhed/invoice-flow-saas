const db = require('./database');
const { v4: uuidv4 } = require('uuid');

class Payment {
  static create({ invoice_id, provider, payment_intent_id, transaction_id, amount, status = 'pending', metadata = {} }) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO payments (id, invoice_id, provider, payment_intent_id, transaction_id, amount, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, invoice_id, provider, payment_intent_id, transaction_id, amount, status, JSON.stringify(metadata));
    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM payments WHERE id = ?');
    const payment = stmt.get(id);
    if (payment && payment.metadata) {
      payment.metadata = JSON.parse(payment.metadata);
    }
    return payment;
  }

  static findByPaymentIntentId(payment_intent_id) {
    const stmt = db.prepare('SELECT * FROM payments WHERE payment_intent_id = ?');
    const payment = stmt.get(payment_intent_id);
    if (payment && payment.metadata) {
      payment.metadata = JSON.parse(payment.metadata);
    }
    return payment;
  }

  static findByTransactionId(transaction_id) {
    const stmt = db.prepare('SELECT * FROM payments WHERE transaction_id = ?');
    const payment = stmt.get(transaction_id);
    if (payment && payment.metadata) {
      payment.metadata = JSON.parse(payment.metadata);
    }
    return payment;
  }

  static updateStatus(id, status) {
    const stmt = db.prepare(`
      UPDATE payments 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(status, id);
    return this.findById(id);
  }

  static updateByPaymentIntentId(payment_intent_id, status) {
    const stmt = db.prepare(`
      UPDATE payments 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE payment_intent_id = ?
    `);
    stmt.run(status, payment_intent_id);
    return this.findByPaymentIntentId(payment_intent_id);
  }
}

module.exports = Payment;
