const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class SecureToken {
  static create(invoice_id, expiresInDays = 30) {
    const id = uuidv4();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    const stmt = db.prepare(`
      INSERT INTO secure_tokens (id, invoice_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, invoice_id, token, expiresAt.toISOString());
    return token;
  }

  static validate(token) {
    const stmt = db.prepare(`
      SELECT * FROM secure_tokens 
      WHERE token = ? AND expires_at > datetime('now')
    `);
    return stmt.get(token);
  }

  static findByInvoiceId(invoice_id) {
    const stmt = db.prepare(`
      SELECT * FROM secure_tokens 
      WHERE invoice_id = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return stmt.get(invoice_id);
  }
}

module.exports = SecureToken;
