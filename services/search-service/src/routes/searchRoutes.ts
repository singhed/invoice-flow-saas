import express from 'express';
import Joi from 'joi';
import { logger, ValidationError } from '@invoice-saas/shared';
import { searchService } from '../services/searchService';

const router = express.Router();

const searchSchema = Joi.object({
  query: Joi.string().trim().required(),
  filters: Joi.object({
    status: Joi.string().valid('draft', 'pending', 'paid', 'overdue', 'cancelled').optional(),
    minAmount: Joi.number().min(0).optional(),
    maxAmount: Joi.number().min(0).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    customerId: Joi.string().optional(),
  }).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('relevance', 'date', 'amount').default('relevance'),
});

const suggestSchema = Joi.object({
  query: Joi.string().trim().min(2).required(),
  limit: Joi.number().integer().min(1).max(10).default(5),
});

const indexSchema = Joi.object({
  invoiceId: Joi.string().required(),
  invoiceData: Joi.object().required(),
});

router.get('/', async (req, res, next) => {
  try {
    const { error, value } = searchSchema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details.map((detail) => detail.message).join(', '));
    }

    const results = await searchService.searchInvoices(value);

    logger.info('Search performed', {
      query: value.query,
      resultsCount: results.total,
    });

    res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/suggest', async (req, res, next) => {
  try {
    const { error, value } = suggestSchema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details.map((detail) => detail.message).join(', '));
    }

    const suggestions = await searchService.getAutocompleteSuggestions(value.query, value.limit);

    logger.info('Autocomplete suggestions generated', {
      query: value.query,
      suggestionsCount: suggestions.length,
    });

    res.status(200).json({
      status: 'success',
      data: suggestions,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/index', async (req, res, next) => {
  try {
    const { error, value } = indexSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      throw new ValidationError(error.details.map((detail) => detail.message).join(', '));
    }

    await searchService.indexInvoice(value.invoiceId, value.invoiceData);

    logger.info('Invoice indexed', {
      invoiceId: value.invoiceId,
    });

    res.status(201).json({
      status: 'success',
      message: 'Invoice indexed successfully',
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/index/:invoiceId', async (req, res, next) => {
  try {
    const { invoiceId } = req.params;

    await searchService.removeFromIndex(invoiceId);

    logger.info('Invoice removed from index', {
      invoiceId,
    });

    res.status(200).json({
      status: 'success',
      message: 'Invoice removed from index',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/index/rebuild', async (req, res, next) => {
  try {
    await searchService.rebuildIndex();

    logger.info('Search index rebuild initiated');

    res.status(202).json({
      status: 'success',
      message: 'Index rebuild initiated',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
