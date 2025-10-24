import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger, AppError } from '@invoice-saas/shared';
import paymentRoutes from './routes/paymentRoutes';
import { config } from './config';

dotenv.config();

const app = express();
const PORT = config.port;

app.disable('x-powered-by');
app.use(helmet());

const allowedOrigins = config.allowedOrigins;

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('CRITICAL SECURITY ERROR: ALLOWED_ORIGINS must be explicitly configured in production environment.');
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn('Payment Service: blocked request from unauthorized origin', { origin });
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(hpp());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many health check requests, please try again later.',
});

app.use(limiter);

app.get('/health', healthLimiter, (_req, res) => {
  res.status(200).json({ status: 'healthy', service: 'payment-service', timestamp: new Date().toISOString() });
});

app.use('/payments', paymentRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    logger.error('Payment Service operational error', {
      statusCode: err.statusCode,
      message: err.message,
    });
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }

  logger.error('Payment Service unexpected error', {
    message: err?.message,
    stack: err?.stack,
  });

  return res.status(500).json({ status: 'error', message: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Payment Service listening on port ${PORT}`);
});

export default app;
