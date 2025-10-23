import express from 'express';
import Joi from 'joi';
import { logger, ValidationError } from '@invoice-saas/shared';
import { shopifyService } from '../services/shopifyService';
import { generateInvoicePdf } from '../services/invoiceGenerator';
import { emailService } from '../services/emailService';
import { buildGratefulEmailContent } from '../templates/gratitudeEmail';
import { InvoiceEmailRequestBody, ShopifyOrder } from '../types';
import { config } from '../config';

const router = express.Router();

const invoiceEmailSchema = Joi.object<InvoiceEmailRequestBody>({
  orderId: Joi.string().trim().required(),
  recipientEmail: Joi.string().email({ tlds: { allow: false } }).optional(),
  personalMessage: Joi.string()
    .max(1500)
    .optional()
    .custom((value, helpers) => {
      if (!value) return value;
      // Strip all HTML tags to prevent email injection
      const stripped = value.replace(/<[^>]*>/g, '');
      // Remove any remaining suspicious characters
      const sanitized = stripped.replace(/[<>'"&]/g, '');
      return sanitized;
    }, 'HTML sanitization'),
});

export const EMAIL_FLOW_MERMAID = `sequenceDiagram
  participant Shopify as Shopify Store
  participant Invoice as Invoice Service
  participant SES as AWS SES
  participant Customer as Customer Inbox
  Shopify->>Invoice: Order paid webhook (orderId)
  Invoice->>Shopify: Fetch order details
  Invoice->>Invoice: Generate PDF invoice
  Invoice->>SES: SendRawEmail with gratitude message + PDF
  SES->>Customer: Deliver beautifully grateful email`;

router.get('/email/diagram', (_req, res) => {
  res.status(200).json({ diagram: EMAIL_FLOW_MERMAID });
});

const determineRecipientEmail = (order: ShopifyOrder, explicit?: string): string | undefined => {
  if (explicit) return explicit;
  return order.email || order.customer?.email;
};

const sanitizeInvoiceName = (order: ShopifyOrder): string => {
  if (order.name) {
    // Remove all special characters except hyphen and underscore
    const sanitized = order.name.replace(/[^a-zA-Z0-9-_]/g, '-');
    // Prevent multiple consecutive hyphens
    const cleaned = sanitized.replace(/-+/g, '-');
    // Remove leading/trailing hyphens
    const trimmed = cleaned.replace(/^-+|-+$/g, '');
    return trimmed || 'Invoice';
  }
  if (order.order_number) {
    return `Order-${order.order_number}`;
  }
  return 'Shopify-Invoice';
};

router.post('/email', async (req, res, next) => {
  try {
    const { error, value } = invoiceEmailSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details.map((detail) => detail.message).join(', '));
    }

    const payload = value as InvoiceEmailRequestBody;

    const order = await shopifyService.getOrder(payload.orderId);

    const recipientEmail = determineRecipientEmail(order, payload.recipientEmail);
    if (!recipientEmail) {
      throw new ValidationError('Unable to determine a recipient email for this order');
    }

    const { buffer: pdfBuffer, meta } = await generateInvoicePdf(order);

    const invoiceName = order.name ?? (order.order_number ? `#${order.order_number}` : '#Invoice');
    const lineItemsSource = Array.isArray(order.line_items) ? order.line_items : [];
    const lineItems = lineItemsSource.map((item) => {
      const quantity = item.quantity ?? 1;
      const price = Number(item.price ?? 0);
      const total = quantity * price;
      return {
        name: item.name,
        quantity,
        unitPrice: price,
        lineTotal: total,
      };
    });

    const storeName = config.company.legalName || 'Shopify Store';

    const { subject, htmlBody, textBody } = buildGratefulEmailContent({
      customerName: meta.customerName || 'there',
      storeName,
      invoiceName,
      subtotal: meta.subtotal,
      taxAmount: meta.taxAmount,
      totalAmount: meta.totalAmount,
      currency: meta.currency,
      personalMessage: payload.personalMessage,
      supportEmail: config.company.supportEmail,
      orderUrl: config.shopify.storeDomain
        ? `https://${config.shopify.storeDomain}/admin/orders/${payload.orderId}`
        : undefined,
      lineItems,
    });

    await emailService.sendInvoiceEmail({
      to: recipientEmail,
      subject,
      textBody,
      htmlBody,
      attachment: {
        fileName: `${sanitizeInvoiceName(order)}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    });

    logger.info('Invoice email queued', {
      orderId: payload.orderId,
      recipientEmail,
    });

    res.status(202).json({
      status: 'success',
      message: 'Invoice email sent via AWS SES',
      recipientEmail,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
