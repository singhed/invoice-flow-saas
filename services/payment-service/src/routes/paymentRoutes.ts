import express from 'express';
import Joi from 'joi';
import { ValidationError } from '@invoice-saas/shared';
import { paymentService, PAYMENT_STATUSES } from '../services/paymentService';

const router = express.Router();

const listSchema = Joi.object({
  invoiceId: Joi.string().trim().optional(),
  status: Joi.string()
    .valid(...PAYMENT_STATUSES)
    .optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

const createSchema = Joi.object({
  invoiceId: Joi.string().trim().required(),
  amount: Joi.number().precision(2).positive().required(),
  currency: Joi.string().trim().uppercase().length(3).optional(),
  method: Joi.string().trim().max(50).required(),
  metadata: Joi.object().unknown(true).optional(),
});

const statusSchema = Joi.object({
  status: Joi.string()
    .valid(...PAYMENT_STATUSES)
    .required(),
  note: Joi.string().max(500).optional(),
  metadata: Joi.object().unknown(true).optional(),
});

const metadataSchema = Joi.object({
  metadata: Joi.object().unknown(true).required(),
});

router.get('/', async (req, res, next) => {
  try {
    const { error, value } = listSchema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details.map((detail) => detail.message).join(', '));
    }

    const result = await paymentService.listPayments(value);

    res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details.map((detail) => detail.message).join(', '));
    }

    const payment = await paymentService.createPayment(value);

    res.status(201).json({
      status: 'success',
      data: payment,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:paymentId', async (req, res, next) => {
  try {
    const payment = await paymentService.getPayment(req.params.paymentId);

    res.status(200).json({
      status: 'success',
      data: payment,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:paymentId/timeline', async (req, res, next) => {
  try {
    const timeline = await paymentService.getTimeline(req.params.paymentId);

    res.status(200).json({
      status: 'success',
      data: timeline,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:paymentId/status', async (req, res, next) => {
  try {
    const { error, value } = statusSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details.map((detail) => detail.message).join(', '));
    }

    const payment = await paymentService.updatePaymentStatus(
      req.params.paymentId,
      value.status,
      value.note,
      value.metadata
    );

    res.status(200).json({
      status: 'success',
      data: payment,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:paymentId/metadata', async (req, res, next) => {
  try {
    const { error, value } = metadataSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details.map((detail) => detail.message).join(', '));
    }

    const payment = await paymentService.updatePaymentMetadata(req.params.paymentId, value.metadata);

    res.status(200).json({
      status: 'success',
      data: payment,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
