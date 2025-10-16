const db = require('./database');
const { v4: uuidv4 } = require('uuid');

class Invoice {
  static create({ client_name, client_email, amount, currency = 'USD', description }) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO invoices (id, client_name, client_email, amount, currency, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, client_name, client_email, amount, currency, description);
    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM invoices WHERE id = ?');
    return stmt.get(id);
  }

  static findByToken(token) {
    const stmt = db.prepare(`
      SELECT i.* FROM invoices i
      JOIN secure_tokens st ON i.id = st.invoice_id
      WHERE st.token = ? AND st.expires_at > datetime('now')
    `);
    return stmt.get(token);
  }

  static updateStatus(id, status) {
    const stmt = db.prepare(`
      UPDATE invoices 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(status, id);
    return this.findById(id);
  }

  static getPayments(invoiceId) {
    const stmt = db.prepare(`
      SELECT * FROM payments 
      WHERE invoice_id = ? 
      ORDER BY created_at DESC
    `);
    return stmt.all(invoiceId);
  }
}

module.exports = Invoice;
