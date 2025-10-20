import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import xss from 'xss';
import { logger, AppError, ValidationError, ConflictError, UnauthorizedError } from '@invoice-saas/shared';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || ACCESS_TOKEN_SECRET;

app.disable('x-powered-by');
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(hpp());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CSRF protection using cookie-based secret and double submit token pattern
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
});

// Simple in-memory user store for demo purposes
interface User {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  role: string;
  createdAt: string;
}

const users = new Map<string, User>(); // key by email lowercased

// In-memory refresh token store (rotation, revocation)
interface RefreshRecord { userId: string; revoked: boolean; expiresAt: number; replacedBy?: string }
const refreshStore = new Map<string, RefreshRecord>(); // jti -> record

// Token helpers
function signAccessToken(user: User) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(user: User) {
  const jti = uuidv4();
  const token = jwt.sign({ sub: user.id, jti }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  const payload = jwt.decode(token) as any;
  const exp = typeof payload?.exp === 'number' ? payload.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
  refreshStore.set(jti, { userId: user.id, revoked: false, expiresAt: exp });
  return { token, jti };
}

function setRefreshCookie(res: express.Response, token: string) {
  res.cookie('rt', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many auth attempts, please try again later.',
  keyGenerator: (req) => {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    try {
      const email = (req.body as any)?.email?.toLowerCase?.() || '';
      return `${ip}:${email}`;
    } catch {
      return ip;
    }
  },
});

// CSRF token endpoint (must come before routes using csrfProtection)
app.get('/auth/csrf-token', csrfProtection, (req, res) => {
  const token = (req as any).csrfToken();
  res.status(200).json({ csrfToken: token });
});

// Input validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).max(254).required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({ 'string.pattern.base': 'Password must include letters and numbers' }),
  name: Joi.string().max(100).allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).max(254).required(),
  password: Joi.string().min(8).max(128).required(),
});

function validateBody(schema: Joi.ObjectSchema) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(new ValidationError(error.details.map((d) => d.message).join(', ')));
    }
    // assign sanitized values
    (req as any).validatedBody = value;
    return next();
  };
}

function sanitizeName(name?: string) {
  if (!name) return undefined;
  return xss(name, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] });
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() });
});

app.post('/auth/register', authLimiter, csrfProtection, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = (req as any).validatedBody as { email: string; password: string; name?: string };

    const normalizedEmail = email.toLowerCase();
    if (users.has(normalizedEmail)) {
      throw new ConflictError('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: uuidv4(),
      email: normalizedEmail,
      name: sanitizeName(name),
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    users.set(normalizedEmail, user);

    const accessToken = signAccessToken(user);
    const { token: refreshToken } = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      token: accessToken,
    });
  } catch (err) {
    next(err);
  }
});

app.post('/auth/login', authLimiter, csrfProtection, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = (req as any).validatedBody as { email: string; password: string };

    const normalizedEmail = email.toLowerCase();
    const user = users.get(normalizedEmail);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = signAccessToken(user);
    const { token: refreshToken } = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      token: accessToken,
    });
  } catch (err) {
    next(err);
  }
});

// Authenticated endpoint to fetch current user
function authGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { id: string; email: string; role: string };
    // Attach decoded user to request for downstream use
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid token'));
  }
}

app.get('/auth/me', authGuard, (req, res) => {
  const decoded = (req as any).user as { id: string; email: string; role: string };
  const user = users.get(decoded.email.toLowerCase());
  if (!user) {
    // This should rarely happen unless user was deleted
    return res.status(404).json({ status: 'error', message: 'User not found' });
  }

  res.status(200).json({
    status: 'success',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// Refresh access token using refresh token cookie (rotation)
app.post('/auth/refresh', authLimiter, csrfProtection, (req, res, next) => {
  try {
    const token = (req.cookies || {})['rt'];
    if (!token) {
      throw new UnauthorizedError('Missing refresh token');
    }

    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as any;
    const jti = decoded?.jti as string;
    const sub = decoded?.sub as string;
    if (!jti || !sub) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const record = refreshStore.get(jti);
    if (!record || record.revoked || record.userId !== sub || record.expiresAt < Date.now()) {
      throw new UnauthorizedError('Refresh token revoked or expired');
    }

    // rotate token
    record.revoked = true;
    const newJti = uuidv4();
    const newRefresh = jwt.sign({ sub, jti: newJti }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    const payload = jwt.decode(newRefresh) as any;
    const exp = typeof payload?.exp === 'number' ? payload.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
    refreshStore.set(newJti, { userId: sub, revoked: false, expiresAt: exp });
    record.replacedBy = newJti;

    // issue access token
    // look up user
    const userById = Array.from(users.values()).find((u) => u.id === sub);
    if (!userById) {
      throw new UnauthorizedError('Account not found');
    }
    const accessToken = signAccessToken(userById);

    setRefreshCookie(res, newRefresh);

    res.status(200).json({ status: 'success', token: accessToken });
  } catch (err) {
    next(err);
  }
});

// Logout: revoke refresh token and clear cookie
app.post('/auth/logout', authLimiter, csrfProtection, (req, res) => {
  const token = (req.cookies || {})['rt'];
  if (token) {
    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as any;
      const jti = decoded?.jti as string;
      const record = jti ? refreshStore.get(jti) : undefined;
      if (record) {
        record.revoked = true;
      }
    } catch {
      // ignore
    }
  }
  res.clearCookie('rt', { path: '/api/auth' });
  res.status(200).json({ status: 'success' });
});

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('Invalid CSRF token');
    return res.status(403).json({ status: 'error', message: 'Invalid CSRF token' });
  }

  if (err instanceof AppError) {
    logger.error('User Service error', { statusCode: err.statusCode, message: err.message });
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }

  logger.error('Unexpected error in User Service', { message: err.message, stack: err.stack });
  return res.status(500).json({ status: 'error', message: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`User Service listening on port ${PORT}`);
});
