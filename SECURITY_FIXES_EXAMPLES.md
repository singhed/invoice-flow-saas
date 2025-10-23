# Security Fixes - Code Examples

This document provides ready-to-use code examples for fixing the identified security vulnerabilities.

---

## Critical Fix #1: Remove Hardcoded JWT Secrets

### Before (❌ Vulnerable):
```typescript
// services/api-gateway/src/middleware/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// services/user-service/src/index.ts
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || ACCESS_TOKEN_SECRET;
```

### After (✅ Secure):
```typescript
// services/api-gateway/src/middleware/auth.ts
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is required. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  throw new Error('CRITICAL: JWT_SECRET must be at least 32 characters long.');
}

// services/user-service/src/index.ts
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET and REFRESH_TOKEN_SECRET must be configured. Application cannot start.');
}

if (ACCESS_TOKEN_SECRET.length < 32 || REFRESH_TOKEN_SECRET.length < 32) {
  throw new Error('CRITICAL: JWT secrets must be at least 32 characters long.');
}

if (ACCESS_TOKEN_SECRET === REFRESH_TOKEN_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET and REFRESH_TOKEN_SECRET must be different.');
}
```

### Generate secure secrets:
```bash
# Run these commands to generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

---

## Critical Fix #2: Fix CORS Wildcard Configuration

### Before (❌ Vulnerable):
```typescript
// services/api-gateway/src/index.ts
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',  // ❌ Wildcard fallback
  credentials: true,
}));
```

### After (✅ Secure):
```typescript
// services/api-gateway/src/index.ts
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Fail startup if ALLOWED_ORIGINS not configured in production
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('CRITICAL: ALLOWED_ORIGINS must be configured in production environment');
}

// Strict origin validation function
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
```

---

## Critical Fix #3: Remove Hardcoded Kubernetes Secrets

### Before (❌ Vulnerable):
```yaml
# infrastructure/kubernetes/base/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: invoice-saas
type: Opaque
stringData:
  jwt-secret: "change-this-in-production-use-secrets-manager"
```

### After (✅ Secure) - Option 1: External Secrets Operator
```yaml
# infrastructure/kubernetes/base/external-secret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: invoice-saas
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: SecretStore
    name: aws-secrets-manager
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
    - secretKey: jwt-secret
      remoteRef:
        key: prod/invoice-saas/jwt-secret
    - secretKey: refresh-token-secret
      remoteRef:
        key: prod/invoice-saas/refresh-token-secret
---
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: invoice-saas
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
```

### After (✅ Secure) - Option 2: Sealed Secrets
```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create secret and seal it
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret="${JWT_SECRET}" \
  --dry-run=client -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml

# The sealed-secret.yaml can be safely committed to Git
```

### Steps to implement:
```bash
# 1. DELETE the existing secrets file from Git
git rm infrastructure/kubernetes/base/secrets.yaml

# 2. Add to .gitignore
echo "infrastructure/kubernetes/base/secrets.yaml" >> .gitignore

# 3. Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name prod/invoice-saas/jwt-secret \
  --secret-string "$(openssl rand -hex 32)"

aws secretsmanager create-secret \
  --name prod/invoice-saas/refresh-token-secret \
  --secret-string "$(openssl rand -hex 32)"
```

---

## Critical Fix #4: Secure Database Credentials

### Before (❌ Vulnerable):
```yaml
# docker-compose.yml
services:
  postgres:
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres  # ❌ Hardcoded
```

### After (✅ Secure):
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    container_name: invoice-saas-postgres
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-invoicedb}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-postgres}']
      interval: 10s
      timeout: 5s
      retries: 5
```

### .env file (DO NOT COMMIT):
```bash
# .env (add to .gitignore)
POSTGRES_USER=invoice_app_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=invoicedb
```

### Update .gitignore:
```
.env
.env.local
.env.*.local
!.env.example
```

---

## Critical Fix #5: Remove Docker Socket Mount

### Before (❌ Vulnerable):
```yaml
# docker-compose.yml
localstack:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock  # ❌ Root access
```

### After (✅ Secure):
```yaml
# docker-compose.yml
localstack:
  image: localstack/localstack:latest
  container_name: invoice-saas-localstack
  ports:
    - '4566:4566'
  environment:
    - SERVICES=s3,sqs,sns,secretsmanager
    - DEBUG=1
    - DATA_DIR=/tmp/localstack/data
    # Remove DOCKER_HOST environment variable
  volumes:
    - localstack_data:/tmp/localstack
    # Docker socket mount removed for security
```

### Alternative (if Docker socket is absolutely needed):
Use Docker socket proxy with read-only access:
```yaml
# docker-compose.yml
docker-proxy:
  image: tecnativa/docker-socket-proxy:latest
  container_name: docker-proxy
  privileged: true
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro  # Read-only
  environment:
    - CONTAINERS=1
    - IMAGES=1
    - INFO=1
    - NETWORKS=0
    - VOLUMES=0
    - POST=0  # Disable write operations

localstack:
  environment:
    - DOCKER_HOST=tcp://docker-proxy:2375
  depends_on:
    - docker-proxy
```

---

## Critical Fix #6: Move Tokens to httpOnly Cookies

### Before (❌ Vulnerable):
```typescript
// services/user-service/src/index.ts
res.status(201).json({
  status: 'success',
  user: { /* ... */ },
  token: accessToken,  // ❌ Token in response body
});
```

### After (✅ Secure):
```typescript
// services/user-service/src/index.ts

// Helper function to set secure cookie
function setAccessTokenCookie(res: express.Response, token: string) {
  res.cookie('access_token', token, {
    httpOnly: true,  // Prevents JavaScript access
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'strict',  // CSRF protection
    path: '/',
    maxAge: 15 * 60 * 1000,  // 15 minutes
  });
}

// Update register endpoint
app.post('/auth/register', authLimiter, csrfProtection, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = (req as any).validatedBody;
    
    // ... user creation logic ...
    
    const accessToken = signAccessToken(user);
    const { token: refreshToken } = signRefreshToken(user);
    
    // Set tokens in httpOnly cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);
    
    // Response without tokens
    res.status(201).json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      // ✅ No token in response body
    });
  } catch (err) {
    next(err);
  }
});

// Update auth middleware to read from cookie
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const publicAuthPaths = new Set([
    '/auth/login',
    '/auth/register',
    '/auth/csrf-token',
    '/auth/refresh',
    '/auth/logout',
  ]);
  
  if (publicAuthPaths.has(req.path)) {
    return next();
  }
  
  // Try to get token from cookie first, fallback to Authorization header
  const token = (req.cookies && req.cookies.access_token) || 
                (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.substring(7));
  
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };
    
    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
};
```

---

## High Priority Fix #7: Strengthen Password Policy

### Before (❌ Weak):
```typescript
password: Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
```

### After (✅ Strong):
```typescript
const passwordSchema = Joi.string()
  .min(12)  // Increased from 8
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
  .required()
  .messages({
    'string.min': 'Password must be at least 12 characters long',
    'string.pattern.base': 'Password must include uppercase, lowercase, numbers, and special characters (@$!%*?&)',
  });

// Optional: Check against common passwords
async function isCommonPassword(password: string): Promise<boolean> {
  const commonPasswords = new Set([
    'password123',
    'Welcome123!',
    'Password1!',
    // Add more common passwords or integrate with haveibeenpwned API
  ]);
  return commonPasswords.has(password);
}

// In register endpoint
app.post('/auth/register', authLimiter, csrfProtection, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = (req as any).validatedBody;
    
    // Check for common password
    if (await isCommonPassword(password)) {
      throw new ValidationError('This password is too common. Please choose a stronger password.');
    }
    
    // ... rest of the logic
  } catch (err) {
    next(err);
  }
});
```

---

## High Priority Fix #8: Increase Bcrypt Rounds

### Before (❌ Weak):
```typescript
const passwordHash = await bcrypt.hash(password, 10);
```

### After (✅ Stronger):
```typescript
// Add configuration constant
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

// Validate configuration
if (BCRYPT_ROUNDS < 12 || BCRYPT_ROUNDS > 15) {
  logger.warn('BCRYPT_ROUNDS should be between 12 and 15. Using default: 12');
}

const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

// Optional: Add timing to ensure acceptable performance
const startTime = Date.now();
const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
const duration = Date.now() - startTime;

if (duration > 500) {
  logger.warn('Password hashing took longer than expected', { duration, rounds: BCRYPT_ROUNDS });
}
```

---

## High Priority Fix #9: Add Rate Limiting to Health Endpoints

### Before (❌ No rate limiting):
```typescript
app.use('/health', healthRoutes);
```

### After (✅ Rate limited):
```typescript
// Create health-specific rate limiter
const healthLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 60,  // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many health check requests, please try again later.',
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn('Health endpoint rate limit exceeded', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many requests',
    });
  },
});

app.use('/health', healthLimiter, healthRoutes);
```

---

## High Priority Fix #10: Implement Redis Session Storage

### Before (❌ In-memory):
```typescript
const users = new Map<string, User>();
const refreshStore = new Map<string, RefreshRecord>();
```

### After (✅ Redis):
```typescript
// Install dependencies first:
// pnpm add redis ioredis

import Redis from 'ioredis';

// Redis client setup
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  logger.error('Redis connection error', err);
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

// User storage functions
async function saveUser(user: User): Promise<void> {
  await redis.setex(`user:${user.email.toLowerCase()}`, 86400, JSON.stringify(user));
}

async function getUser(email: string): Promise<User | null> {
  const data = await redis.get(`user:${email.toLowerCase()}`);
  return data ? JSON.parse(data) : null;
}

// Refresh token storage
async function saveRefreshToken(jti: string, record: RefreshRecord): Promise<void> {
  const ttl = Math.floor((record.expiresAt - Date.now()) / 1000);
  await redis.setex(`refresh:${jti}`, ttl, JSON.stringify(record));
}

async function getRefreshToken(jti: string): Promise<RefreshRecord | null> {
  const data = await redis.get(`refresh:${jti}`);
  return data ? JSON.parse(data) : null;
}

async function revokeRefreshToken(jti: string): Promise<void> {
  const record = await getRefreshToken(jti);
  if (record) {
    record.revoked = true;
    await saveRefreshToken(jti, record);
  }
}

// Update register endpoint to use Redis
app.post('/auth/register', authLimiter, csrfProtection, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = (req as any).validatedBody;
    
    const normalizedEmail = email.toLowerCase();
    const existingUser = await getUser(normalizedEmail);
    
    if (existingUser) {
      throw new ConflictError('User already exists');
    }
    
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user: User = {
      id: uuidv4(),
      email: normalizedEmail,
      name: sanitizeName(name),
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    
    await saveUser(user);
    
    // ... rest of logic
  } catch (err) {
    next(err);
  }
});
```

---

## High Priority Fix #11: Add Security Event Logging

### Before (❌ No logging):
```typescript
if (!passwordOk) {
  throw new UnauthorizedError('Invalid credentials');
}
```

### After (✅ Comprehensive logging):
```typescript
// Create security logger
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security-events.log' }),
    new winston.transports.Console(),
  ],
});

// Failed login tracking
const failedLoginAttempts = new Map<string, number>();

async function recordFailedLogin(email: string, req: express.Request): Promise<void> {
  const key = `${email}:${req.ip}`;
  const attempts = (failedLoginAttempts.get(key) || 0) + 1;
  failedLoginAttempts.set(key, attempts);
  
  securityLogger.warn('Failed login attempt', {
    email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    attempts,
    timestamp: new Date().toISOString(),
    type: 'AUTH_FAILURE',
  });
  
  // Alert on suspicious patterns
  if (attempts >= 5) {
    securityLogger.error('Multiple failed login attempts detected', {
      email,
      ip: req.ip,
      attempts,
      type: 'BRUTE_FORCE_SUSPECTED',
    });
    // TODO: Send alert to security team
  }
  
  // Clear after 15 minutes
  setTimeout(() => failedLoginAttempts.delete(key), 15 * 60 * 1000);
}

// Update login endpoint
app.post('/auth/login', authLimiter, csrfProtection, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = (req as any).validatedBody;
    const normalizedEmail = email.toLowerCase();
    const user = await getUser(normalizedEmail);
    
    if (!user) {
      await recordFailedLogin(normalizedEmail, req);
      throw new UnauthorizedError('Invalid credentials');
    }
    
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      await recordFailedLogin(normalizedEmail, req);
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Clear failed attempts on successful login
    const key = `${normalizedEmail}:${req.ip}`;
    failedLoginAttempts.delete(key);
    
    // Log successful login
    securityLogger.info('Successful login', {
      email: normalizedEmail,
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      type: 'AUTH_SUCCESS',
    });
    
    // ... rest of logic
  } catch (err) {
    next(err);
  }
});

// Log other security events
function logSecurityEvent(type: string, details: any, req?: express.Request) {
  securityLogger.info(type, {
    ...details,
    ip: req?.ip,
    userAgent: req?.headers['user-agent'],
    timestamp: new Date().toISOString(),
  });
}

// Examples of other security events to log:
// - Password changes
// - Email changes  
// - Role/permission changes
// - Token refresh
// - Logout
// - Failed authorization (accessing resources without permission)
// - Unusual access patterns
```

---

## Testing Security Fixes

```bash
# Test JWT secret validation
NODE_ENV=production JWT_SECRET=short npm start  # Should fail

# Test CORS
curl -H "Origin: http://evil.com" -I http://localhost:3000/api/auth/login
# Should return 403 or error

# Test rate limiting
for i in {1..70}; do curl http://localhost:3000/health; done
# Should return 429 after 60 requests

# Test password strength
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"weak"}'
# Should fail validation

# Test cookie-based auth
curl -c cookies.txt -b cookies.txt \
  -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
# Should set httpOnly cookie
```

---

## Deployment Checklist

Before deploying with these security fixes:

- [ ] Generate and securely store all secrets
- [ ] Configure ALLOWED_ORIGINS for your domain
- [ ] Set up Redis for session storage
- [ ] Configure AWS Secrets Manager or equivalent
- [ ] Update all environment variables
- [ ] Enable HTTPS on all endpoints
- [ ] Test all authentication flows
- [ ] Verify rate limiting works
- [ ] Test CORS with your frontend domain
- [ ] Verify security logs are being generated
- [ ] Set up monitoring and alerting
- [ ] Review and rotate all credentials
- [ ] Test with security scanning tools

---

**Last Updated:** 2024  
**Next Review:** After implementing fixes
