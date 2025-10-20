import { Router } from 'express';
import axios from 'axios';
import { logger } from '@invoice-saas/shared';

const router = Router();

const INVOICE_SERVICE_URL = process.env.INVOICE_SERVICE_URL || 'http://invoice-service:3001';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3003';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3003';

const proxyRequest = async (req: any, res: any, targetUrl: string) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${targetUrl}${req.path}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined,
      },
      params: req.query,
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error('Proxy request failed:', error);
    res.status(error.response?.status || 500).json({
      status: 'error',
      message: error.response?.data?.message || 'Service unavailable',
    });
  }
};

router.all('/invoices*', (req, res) => proxyRequest(req, res, INVOICE_SERVICE_URL));
router.all('/payments*', (req, res) => proxyRequest(req, res, PAYMENT_SERVICE_URL));
router.all('/users*', (req, res) => proxyRequest(req, res, USER_SERVICE_URL));
router.all('/auth*', (req, res) => proxyRequest(req, res, AUTH_SERVICE_URL));

export default router;
