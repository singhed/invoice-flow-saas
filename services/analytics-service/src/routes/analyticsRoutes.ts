import express from 'express';
import { logger } from '@invoice-saas/shared';
import { analyticsService } from '../services/analyticsService';

const router = express.Router();

router.get('/dashboard/overview', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const overview = await analyticsService.getDashboardOverview(start, end);

    logger.info('Dashboard overview requested', {
      startDate: start,
      endDate: end,
    });

    res.status(200).json({
      status: 'success',
      data: overview,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/revenue/trends', async (req, res, next) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const trends = await analyticsService.getRevenueTrends(start, end, period as string);

    logger.info('Revenue trends requested', {
      period,
      startDate: start,
      endDate: end,
    });

    res.status(200).json({
      status: 'success',
      data: trends,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices/by-status', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const statusBreakdown = await analyticsService.getInvoicesByStatus(start, end);

    logger.info('Invoice status breakdown requested', {
      startDate: start,
      endDate: end,
    });

    res.status(200).json({
      status: 'success',
      data: statusBreakdown,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/customers/top', async (req, res, next) => {
  try {
    const { limit = '10', startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const topCustomers = await analyticsService.getTopCustomers(start, end, parseInt(limit as string, 10));

    logger.info('Top customers requested', {
      limit,
      startDate: start,
      endDate: end,
    });

    res.status(200).json({
      status: 'success',
      data: topCustomers,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/payment/metrics', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const paymentMetrics = await analyticsService.getPaymentMetrics(start, end);

    logger.info('Payment metrics requested', {
      startDate: start,
      endDate: end,
    });

    res.status(200).json({
      status: 'success',
      data: paymentMetrics,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/events', async (req, res, next) => {
  try {
    const { eventType, eventData, userId, metadata } = req.body;

    await analyticsService.trackEvent({
      eventType,
      eventData,
      userId,
      metadata,
      timestamp: new Date(),
    });

    logger.info('Analytics event tracked', {
      eventType,
      userId,
    });

    res.status(201).json({
      status: 'success',
      message: 'Event tracked successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
