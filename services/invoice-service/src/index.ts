import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger, AppError } from '@invoice-saas/shared';
import invoiceRoutes from './routes/invoiceRoutes';
import { config } from './config';

dotenv.config();

const app = express();
const PORT = config.port;

app.disable('x-powered-by');
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.use(hpp());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', service: 'invoice-service', timestamp: new Date().toISOString() });
});

app.use('/invoices', invoiceRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    logger.error('Invoice service operational error', {
      statusCode: err.statusCode,
      message: err.message,
    });
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }

  logger.error('Invoice service unexpected error', {
    message: err?.message,
    stack: err?.stack,
  });

  return res.status(500).json({ status: 'error', message: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Invoice Service listening on port ${PORT}`);
});

export default app;
