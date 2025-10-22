import PDFDocument from 'pdfkit';
import { config } from '../config';
import { ShopifyOrder } from '../types';

interface GeneratedInvoiceMeta {
  customerName: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  currency: string;
}

const toNumber = (value?: string | number): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const resolveCustomerName = (order: ShopifyOrder): string => {
  const customer = order.customer;
  if (!customer) {
    return 'there';
  }
  const { first_name, last_name } = customer;
  if (first_name || last_name) {
    return [first_name, last_name].filter(Boolean).join(' ').trim();
  }
  return customer.email ?? 'there';
};

export const generateInvoicePdf = (order: ShopifyOrder): Promise<{ buffer: Buffer; meta: GeneratedInvoiceMeta }> => {
  const currency = order.currency ?? config.invoice.defaultCurrency;
  const subtotal = toNumber(order.subtotal_price ?? order.current_total_price);
  const total = toNumber(order.current_total_price);
  const tax = toNumber(order.total_tax);
  const customerName = resolveCustomerName(order);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on('error', reject);
    doc.on('end', () => {
      resolve({
        buffer: Buffer.concat(chunks),
        meta: {
          customerName,
          totalAmount: total || subtotal,
          subtotal: subtotal || total,
          taxAmount: tax,
          currency,
        },
      });
    });

    doc.fontSize(22).font('Helvetica-Bold').text(`${config.company.legalName} Invoice`, { align: 'left' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica').text(config.company.legalName);
    doc.text(config.company.postalAddress);
    doc.text(`Support: ${config.company.supportEmail}`);
    doc.moveDown();

    const invoiceName = order.name ?? (order.order_number ? `#${order.order_number}` : 'Invoice');
    const issuedOn = order.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString();

    doc.fontSize(12).font('Helvetica-Bold').text(`Invoice ${invoiceName}`);
    doc.font('Helvetica').text(`Issued on ${issuedOn}`);
    if (order.billing_address?.name) {
      doc.text(`Billed to: ${order.billing_address.name}`);
    }
    if (order.billing_address?.address1) {
      doc.text(order.billing_address.address1);
    }
    if (order.billing_address?.city || order.billing_address?.country) {
      const cityLine = [order.billing_address?.city, order.billing_address?.province, order.billing_address?.zip].filter(Boolean).join(', ');
      const country = order.billing_address?.country;
      doc.text([cityLine, country].filter(Boolean).join(' · '));
    }
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Item', 50, doc.y, { continued: true });
    doc.text('Qty', 260, doc.y, { continued: true });
    doc.text('Unit Price', 330, doc.y, { continued: true });
    doc.text('Total', 430, doc.y);

    doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');

    const items = Array.isArray(order.line_items) ? order.line_items : [];

    if (items.length === 0) {
      doc.text('No line items available', 50, doc.y);
      doc.moveDown();
    }

    items.forEach((item) => {
      const quantity = item.quantity ?? 1;
      const price = toNumber(item.price);
      const lineTotal = quantity * price;

      doc.text(item.name, 50, doc.y, { continued: true });
      doc.text(String(quantity), 260, doc.y, { continued: true });
      doc.text(formatCurrency(price, currency), 330, doc.y, { continued: true });
      doc.text(formatCurrency(lineTotal, currency), 430, doc.y);
      doc.moveDown(0.2);
    });

    doc.moveDown();
    doc.moveTo(300, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.2);

    const summaryStartY = doc.y;
    doc.text('Subtotal:', 320, summaryStartY, { continued: true });
    doc.text(formatCurrency(subtotal || total, currency), 430, summaryStartY);
    doc.text('Tax:', 320, doc.y, { continued: true });
    doc.text(formatCurrency(tax, currency), 430, doc.y);
    doc.font('Helvetica-Bold').text('Total Due:', 320, doc.y, { continued: true });
    doc.text(formatCurrency(total || subtotal, currency), 430, doc.y);
    doc.font('Helvetica');

    doc.moveDown(1.5);
    doc.fontSize(12).text(`Dear ${customerName},`);
    doc.moveDown(0.2);
    doc.text('Thank you for trusting Shopify and our invoicing platform with your business.');
    doc.text('We are deeply grateful for your partnership and are excited to continue scaling with you.');
    doc.text('If there is anything we can do to support your next milestone, simply reply to this email.');

    if (order.note) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Oblique').text(`Merchant note: ${order.note}`);
      doc.font('Helvetica');
    }

    doc.moveDown(1);
    doc.text('Warmly,');
    doc.text(config.company.legalName);

    doc.end();
  });
};
