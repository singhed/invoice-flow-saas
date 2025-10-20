import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { logger } from '@invoice-saas/shared';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import proxyRoutes from './routes/proxy';
import healthRoutes from './routes/health';

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(hpp());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many auth attempts, please try again later.',
});

app.use('/api/', limiter);

// Enforce strict origin checks for unauthenticated auth endpoints
function originCheckStrict(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const origin = req.headers.origin || '';
  // Allow if Authorization header is present (token-based, not cookie-based)
  if (req.headers.authorization) return next();
  if (allowedOrigins.length === 0) return next();
  if (origin && allowedOrigins.includes(origin as string)) return next();
  return res.status(403).json({ status: 'error', message: 'Forbidden origin' });
}

try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  logger.warn('Swagger documentation not available');
}

app.use('/health', healthRoutes);

// Apply stricter protections and rate limits to auth endpoints
app.use('/api/auth', originCheckStrict, authLimiter);

app.use('/api', authMiddleware, proxyRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});

export default app;
