import express from 'express';
import Joi from 'joi';
import { logger, ValidationError } from '@invoice-saas/shared';
import { shopifyService } from '../services/shopifyService';
import { generateInvoicePdf } from '../services/invoiceGenerator';
import { emailService } from '../services/emailService';
import { buildGratefulEmailContent } from '../templates/gratitudeEmail';
import { InvoiceEmailRequestBody, ShopifyOrder } from '../types';
import { config } from '../config';
import { exportService } from '../services/exportService';
import { budgetService } from '../services/budgetService';

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

router.get('/export', async (req, res, next) => {
  try {
    const { format = 'csv', status, startDate, endDate } = req.query;

    const mockInvoices = [
      {
        id: '1',
        invoiceNumber: 'INV-001',
        customerName: 'Acme Corp',
        customerEmail: 'billing@acme.com',
        amount: 1500.00,
        currency: 'USD',
        status: 'paid',
        issueDate: '2024-01-15',
        dueDate: '2024-02-15',
        paidDate: '2024-02-10',
        description: 'Consulting services',
      },
      {
        id: '2',
        invoiceNumber: 'INV-002',
        customerName: 'TechStart Inc',
        customerEmail: 'finance@techstart.com',
        amount: 2500.00,
        currency: 'USD',
        status: 'pending',
        issueDate: '2024-01-20',
        dueDate: '2024-02-20',
        description: 'Software development',
      },
    ];

    const exportData = await exportService.exportInvoices(mockInvoices, format as string);
    const mimeType = exportService.getMimeType(format as string);
    const extension = exportService.getFileExtension(format as string);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="invoices-export-${Date.now()}.${extension}"`);

    logger.info('Invoices exported', { format, count: mockInvoices.length });

    res.send(exportData);
  } catch (err) {
    next(err);
  }
});

router.post('/budgets', async (req, res, next) => {
  try {
    const { name, amount, currency, period, startDate, endDate, category, customerId } = req.body;

    const budget = await budgetService.createBudget({
      name,
      amount,
      currency,
      period,
      startDate,
      endDate,
      category,
      customerId,
    });

    logger.info('Budget created', { budgetId: budget.id });

    res.status(201).json({
      status: 'success',
      data: budget,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/budgets', async (req, res, next) => {
  try {
    const { customerId, period } = req.query;

    const budgets = await budgetService.getAllBudgets({
      customerId: customerId as string,
      period: period as string,
    });

    logger.info('Budgets retrieved', { count: budgets.length });

    res.status(200).json({
      status: 'success',
      data: budgets,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/budgets/:budgetId', async (req, res, next) => {
  try {
    const { budgetId } = req.params;

    const budgetStatus = await budgetService.getBudgetStatus(budgetId);

    if (!budgetStatus) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
    }

    logger.info('Budget status retrieved', { budgetId });

    res.status(200).json({
      status: 'success',
      data: budgetStatus,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/budgets/:budgetId', async (req, res, next) => {
  try {
    const { budgetId } = req.params;
    const updates = req.body;

    const updatedBudget = await budgetService.updateBudget(budgetId, updates);

    if (!updatedBudget) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
    }

    logger.info('Budget updated', { budgetId });

    res.status(200).json({
      status: 'success',
      data: updatedBudget,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/budgets/:budgetId', async (req, res, next) => {
  try {
    const { budgetId } = req.params;

    const deleted = await budgetService.deleteBudget(budgetId);

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
    }

    logger.info('Budget deleted', { budgetId });

    res.status(200).json({
      status: 'success',
      message: 'Budget deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/budgets/alerts/all', async (req, res, next) => {
  try {
    const alerts = await budgetService.getBudgetAlerts();

    logger.info('Budget alerts retrieved', { count: alerts.length });

    res.status(200).json({
      status: 'success',
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/budgets/reports/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const report = await budgetService.generateBudgetReport({
      startDate: startDate as string,
      endDate: endDate as string,
    });

    logger.info('Budget report generated');

    res.status(200).json({
      status: 'success',
      data: report,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
