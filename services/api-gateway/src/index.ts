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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('CRITICAL SECURITY ERROR: ALLOWED_ORIGINS must be explicitly configured in production environment.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow if no origins configured
    if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS: Blocked request from unauthorized origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// Health check rate limiter to prevent DDoS
const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many health check requests, please try again later.',
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

// Only enable Swagger documentation in development or with explicit flag
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_API_DOCS === 'true') {
  try {
    const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
    
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_API_DOCS === 'true') {
      logger.warn('API documentation is enabled in production. Consider protecting with authentication.');
      // In production with flag, require authentication
      app.use('/api-docs', authMiddleware, requireRole('admin'), swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } else {
      // In development, no auth required
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
  } catch (error) {
    logger.warn('Swagger documentation not available');
  }
} else {
  logger.info('API documentation is disabled in production for security');
}

app.use('/health', healthLimiter, healthRoutes);

// Apply stricter protections and rate limits to auth endpoints
app.use('/api/auth', originCheckStrict, authLimiter);

app.use('/api', authMiddleware, proxyRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});

export default app;
