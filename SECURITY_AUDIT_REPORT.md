# Security Audit Report - Invoice SaaS Monorepo

**Audit Date:** 2024  
**Auditor:** Security Analysis Tool  
**Scope:** Complete codebase recursive security scan

---

## Executive Summary

This security audit identified **18 real security vulnerabilities** across the Invoice SaaS monorepo codebase. The issues range from **CRITICAL** to **LOW** severity and affect authentication, configuration management, data protection, and infrastructure security.

**Critical Issues:** 6  
**High Issues:** 7  
**Medium Issues:** 3  
**Low Issues:** 2

---

## Critical Vulnerabilities

### 1. Hardcoded Weak JWT Secrets

**Severity:** CRITICAL  
**CWE:** CWE-798 (Use of Hard-coded Credentials)

**Location:**
- `.env.example:3-4`
- `services/api-gateway/src/middleware/auth.ts:5`
- `services/user-service/src/index.ts:20-21`

**Issue:**
```javascript
// services/user-service/src/index.ts
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || ACCESS_TOKEN_SECRET;
```

The code uses weak fallback secrets when environment variables are not set. If deployed without proper configuration, JWT tokens can be easily forged, leading to complete authentication bypass.

**Impact:**
- Complete authentication bypass
- Account takeover
- Privilege escalation
- Data breach

**Remediation:**
1. Remove all default fallback values for secrets
2. Fail application startup if JWT_SECRET is not provided
3. Use cryptographically secure random strings (minimum 256 bits)
4. Store secrets in proper secret management systems (AWS Secrets Manager, HashiCorp Vault)
5. Rotate secrets regularly

**Recommended Code:**
```typescript
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('CRITICAL: JWT secrets must be configured. Application cannot start.');
}

if (ACCESS_TOKEN_SECRET.length < 32 || REFRESH_TOKEN_SECRET.length < 32) {
  throw new Error('CRITICAL: JWT secrets must be at least 32 characters long.');
}
```

---

### 2. Hardcoded Credentials in Kubernetes Secrets

**Severity:** CRITICAL  
**CWE:** CWE-798 (Use of Hard-coded Credentials)

**Location:**
- `infrastructure/kubernetes/base/secrets.yaml:8`
- `infrastructure/kubernetes/base/secrets.yaml:20`
- `infrastructure/kubernetes/base/secrets.yaml:33`

**Issue:**
```yaml
stringData:
  jwt-secret: "change-this-in-production-use-secrets-manager"
  password: "change-me"
  auth_token: "change-me"
```

Kubernetes secret manifests contain placeholder credentials that may be accidentally deployed to production. These files are tracked in Git, exposing the secret structure.

**Impact:**
- Credential exposure in version control
- Accidental deployment of weak credentials
- Database compromise
- Complete system takeover

**Remediation:**
1. Never commit actual secrets to Git, even as examples
2. Use external secret management (AWS Secrets Manager, External Secrets Operator)
3. Implement sealed-secrets or similar for GitOps
4. Use Kustomize secretGenerator with external sources
5. Add pre-commit hooks to prevent secret commits

**Recommended Approach:**
```yaml
# Use External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
  target:
    name: app-secrets
  data:
    - secretKey: jwt-secret
      remoteRef:
        key: prod/invoice-saas/jwt-secret
```

---

### 3. Weak Database Credentials in Docker Compose

**Severity:** CRITICAL  
**CWE:** CWE-521 (Weak Password Requirements)

**Location:**
- `docker-compose.yml:10-12`

**Issue:**
```yaml
environment:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  POSTGRES_DB: invoicedb
```

Uses default PostgreSQL credentials that are well-known and easily guessable.

**Impact:**
- Unauthorized database access
- Data breach
- Data manipulation/deletion
- Lateral movement in network

**Remediation:**
1. Use strong, randomly generated passwords
2. Store credentials in .env file (never committed)
3. Use Docker secrets for sensitive data
4. Implement network isolation
5. Enable SSL/TLS for database connections

---

### 4. CORS Wildcard Origin Configuration

**Severity:** CRITICAL  
**CWE:** CWE-942 (Overly Permissive Cross-domain Whitelist)

**Location:**
- `services/api-gateway/src/index.ts:23`
- `services/invoice-service/src/index.ts:26`
- `services/user-service/src/index.ts:28`

**Issue:**
```typescript
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));
```

When `ALLOWED_ORIGINS` is not configured, CORS allows all origins (`*`), but still sets `credentials: true`. This combination can enable CSRF attacks and credential theft.

**Impact:**
- Cross-Site Request Forgery (CSRF) attacks
- Cookie theft
- Authentication token exposure
- Unauthorized API access from malicious domains

**Remediation:**
1. Never use wildcard origin with credentials
2. Require explicit ALLOWED_ORIGINS configuration
3. Fail startup if ALLOWED_ORIGINS is not set in production
4. Implement strict origin validation

**Recommended Code:**
```typescript
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must be configured in production');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));
```

---

### 5. Docker Socket Exposure

**Severity:** CRITICAL  
**CWE:** CWE-250 (Execution with Unnecessary Privileges)

**Location:**
- `docker-compose.yml:48`

**Issue:**
```yaml
volumes:
  - localstack_data:/tmp/localstack
  - /var/run/docker.sock:/var/run/docker.sock
```

Mounting the Docker socket gives the container full control over the host Docker daemon, essentially root access to the host system.

**Impact:**
- Container escape
- Host system compromise
- Privilege escalation to root
- Complete infrastructure takeover

**Remediation:**
1. Remove Docker socket mount if not absolutely necessary
2. Use Docker-in-Docker (DinD) with proper isolation
3. Implement least privilege principle
4. Use rootless Docker
5. Consider alternatives to localstack that don't require socket access

---

### 6. Access Tokens in Response Body

**Severity:** CRITICAL  
**CWE:** CWE-522 (Insufficiently Protected Credentials)

**Location:**
- `services/user-service/src/index.ts:194`
- `services/user-service/src/index.ts:230`
- `services/user-service/src/index.ts:313`

**Issue:**
```typescript
res.status(201).json({
  status: 'success',
  user: { /* ... */ },
  token: accessToken,  // ❌ Token in response body
});
```

Access tokens sent in JSON response body can be captured by XSS attacks, malicious browser extensions, or logging systems.

**Impact:**
- XSS-based token theft
- Session hijacking
- Persistent access after XSS is patched
- Token logging in analytics/monitoring tools

**Remediation:**
1. Store access tokens in httpOnly, secure cookies
2. Use short-lived access tokens (5-15 minutes)
3. Implement token binding
4. Use SameSite cookie attribute
5. Consider using the BFF (Backend for Frontend) pattern

---

## High Severity Vulnerabilities

### 7. Weak Password Policy

**Severity:** HIGH  
**CWE:** CWE-521 (Weak Password Requirements)

**Location:**
- `services/user-service/src/index.ts:124-129`

**Issue:**
```typescript
password: Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .required()
```

Password policy only requires 8 characters with letters and numbers. No uppercase, special characters, or complexity requirements.

**Impact:**
- Easier brute force attacks
- Credential stuffing success
- Dictionary attacks
- Weak password selection by users

**Remediation:**
```typescript
password: Joi.string()
  .min(12)  // Increase minimum length
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
  .required()
  .messages({
    'string.pattern.base': 'Password must include uppercase, lowercase, numbers, and special characters'
  }),
```

Also implement:
- Password strength meter on frontend
- Check against common password lists (haveibeenpwned API)
- Enforce password history (prevent reuse)
- Implement account lockout after failed attempts

---

### 8. Missing Bcrypt Work Factor Configuration

**Severity:** HIGH  
**CWE:** CWE-916 (Use of Password Hash With Insufficient Computational Effort)

**Location:**
- `services/user-service/src/index.ts:168`

**Issue:**
```typescript
const passwordHash = await bcrypt.hash(password, 10);
```

Uses bcrypt with only 10 rounds. Modern recommendations suggest 12-14 rounds for better security against brute force attacks.

**Impact:**
- Faster password cracking if database is compromised
- Reduced resistance to brute force attacks
- Insufficient protection against GPU-based attacks

**Remediation:**
```typescript
const BCRYPT_ROUNDS = 12; // Adjust based on performance requirements
const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
```

---

### 9. No Rate Limiting on Health Endpoints

**Severity:** HIGH  
**CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)

**Location:**
- `services/api-gateway/src/index.ts:70`
- `services/invoice-service/src/index.ts:46-48`
- `services/user-service/src/index.ts:155-157`

**Issue:**
```typescript
app.use('/health', healthRoutes);  // No rate limiting
```

Health endpoints are exposed without rate limiting, allowing unlimited requests.

**Impact:**
- DDoS attacks
- Resource exhaustion
- Service reconnaissance
- Infrastructure mapping
- Cost increase (if using pay-per-request services)

**Remediation:**
```typescript
const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many health check requests',
});

app.use('/health', healthLimiter, healthRoutes);
```

---

### 10. Insecure Session Storage (In-Memory)

**Severity:** HIGH  
**CWE:** CWE-539 (Use of Persistent Cookies Containing Sensitive Information)

**Location:**
- `services/user-service/src/index.ts:58-62`

**Issue:**
```typescript
const users = new Map<string, User>(); // In-memory storage
const refreshStore = new Map<string, RefreshRecord>(); // In-memory storage
```

All user data and refresh tokens stored in memory, lost on server restart. No persistence or sharing across instances.

**Impact:**
- All users logged out on server restart
- No horizontal scaling possible
- Session loss during deployment
- No session audit trail
- Vulnerability to memory attacks

**Remediation:**
1. Use Redis for session storage
2. Implement proper database for user data
3. Use distributed session management
4. Implement session replication across instances

---

### 11. Missing Input Sanitization for Personal Message

**Severity:** HIGH  
**CWE:** CWE-79 (Improper Neutralization of Input During Web Page Generation)

**Location:**
- `services/invoice-service/src/routes/invoiceRoutes.ts:16`
- `services/invoice-service/src/templates/gratitudeEmail.ts` (if exists)

**Issue:**
```typescript
personalMessage: Joi.string().max(1500).optional(),
```

Personal message field allows 1500 characters but no explicit sanitization before including in email templates. While XSS library is used elsewhere, this field needs special attention as it goes into emails.

**Impact:**
- Email HTML injection
- Phishing attacks via crafted messages
- Email client exploits
- Social engineering attacks

**Remediation:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

personalMessage: Joi.string()
  .max(1500)
  .optional()
  .custom((value, helpers) => {
    // Strip all HTML tags
    const cleaned = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
    if (cleaned !== value) {
      return helpers.error('string.unsafe');
    }
    return cleaned;
  })
```

---

### 12. Insufficient Logging of Security Events

**Severity:** HIGH  
**CWE:** CWE-778 (Insufficient Logging)

**Location:**
- `services/user-service/src/index.ts:200-234` (login endpoint)
- `services/api-gateway/src/middleware/auth.ts:49-51`

**Issue:**
```typescript
if (!passwordOk) {
  throw new UnauthorizedError('Invalid credentials');  // No logging of failed attempt
}
```

Failed authentication attempts, authorization failures, and other security events are not logged with sufficient detail.

**Impact:**
- Cannot detect brute force attacks
- No audit trail for security incidents
- Difficult to investigate breaches
- Cannot identify attack patterns
- No alerting on suspicious activity

**Remediation:**
```typescript
if (!passwordOk) {
  logger.warn('Failed login attempt', {
    email: normalizedEmail,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    attemptType: 'invalid_password'
  });
  throw new UnauthorizedError('Invalid credentials');
}

// Also implement:
// - Track consecutive failed attempts
// - Alert on suspicious patterns
// - Log all security-relevant events
// - Include correlation IDs for tracing
```

---

### 13. Missing API Documentation Authentication

**Severity:** HIGH  
**CWE:** CWE-306 (Missing Authentication for Critical Function)

**Location:**
- `services/api-gateway/src/index.ts:63-68`

**Issue:**
```typescript
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  logger.warn('Swagger documentation not available');
}
```

Swagger/API documentation exposed publicly without authentication, revealing API structure, endpoints, and parameters.

**Impact:**
- API structure disclosure
- Attack surface enumeration
- Information leakage about business logic
- Easier exploit development
- Competitive intelligence leak

**Remediation:**
```typescript
// Only enable in development or behind authentication
if (process.env.NODE_ENV === 'development') {
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else if (process.env.ENABLE_API_DOCS === 'true') {
  // In production, require authentication
  app.use('/api-docs', authMiddleware, requireRole('admin'), swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
```

---

## Medium Severity Vulnerabilities

### 14. Insufficient CSRF Token Validation

**Severity:** MEDIUM  
**CWE:** CWE-352 (Cross-Site Request Forgery)

**Location:**
- `services/api-gateway/src/index.ts:52-61`

**Issue:**
```typescript
function originCheckStrict(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const origin = req.headers.origin || '';
  // Allow if Authorization header is present (token-based, not cookie-based)
  if (req.headers.authorization) return next();  // ❌ Bypasses origin check
  // ...
}
```

The origin check is bypassed if an Authorization header is present, but this doesn't prevent CSRF if the token is stolen or leaked.

**Impact:**
- CSRF attacks with leaked tokens
- Reduced CSRF protection effectiveness
- Token-based CSRF (if tokens are in localStorage)

**Remediation:**
1. Always validate origin for state-changing operations
2. Implement proper CSRF tokens even with JWT
3. Use SameSite cookies
4. Validate referer header as additional check

---

### 15. Missing HTTPS Enforcement

**Severity:** MEDIUM  
**CWE:** CWE-319 (Cleartext Transmission of Sensitive Information)

**Location:**
- `services/user-service/src/index.ts:44`
- `services/user-service/src/index.ts:82`

**Issue:**
```typescript
secure: process.env.NODE_ENV === 'production',
```

Secure flag only enabled in production, but no forced redirect from HTTP to HTTPS. Cookies can be transmitted over HTTP in development/staging.

**Impact:**
- Cookie theft via network sniffing
- Man-in-the-middle attacks
- Credential interception
- Session hijacking

**Remediation:**
```typescript
// Always use secure in non-local environments
const isProduction = process.env.NODE_ENV === 'production';
const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';

app.use((req, res, next) => {
  if (!isLocal && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
});

// Use strict transport security
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

---

### 16. Loose File Name Sanitization

**Severity:** MEDIUM  
**CWE:** CWE-73 (External Control of File Name or Path)

**Location:**
- `services/invoice-service/src/routes/invoiceRoutes.ts:39-47`

**Issue:**
```typescript
const sanitizeInvoiceName = (order: ShopifyOrder): string => {
  if (order.name) {
    return order.name.replace(/[^a-zA-Z0-9-_#]/g, '-');  // Allows '#' which could be problematic
  }
  // ...
};
```

File name sanitization allows `#` character which can cause issues in some filesystems and URLs.

**Impact:**
- File system issues
- URL encoding problems
- Potential path traversal (minor risk)
- File access issues

**Remediation:**
```typescript
const sanitizeInvoiceName = (order: ShopifyOrder): string => {
  if (order.name) {
    // Remove all special characters except hyphen and underscore
    const sanitized = order.name.replace(/[^a-zA-Z0-9-_]/g, '-');
    // Prevent multiple consecutive hyphens
    const cleaned = sanitized.replace(/-+/g, '-');
    // Remove leading/trailing hyphens
    return cleaned.replace(/^-+|-+$/g, '') || 'invoice';
  }
  if (order.order_number) {
    return `Order-${order.order_number}`;
  }
  return 'Shopify-Invoice';
};
```

---

## Low Severity Vulnerabilities

### 17. Verbose Error Messages

**Severity:** LOW  
**CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)

**Location:**
- `services/api-gateway/src/middleware/errorHandler.ts:11-20`

**Issue:**
```typescript
logger.error('Application error:', {
  statusCode: err.statusCode,
  message: err.message,
  stack: err.stack,  // Stack traces in logs
});
```

While stack traces should be logged, ensure they're not sent to the client in production.

**Impact:**
- Information disclosure about system internals
- Framework version leakage
- File path disclosure
- Easier exploit development

**Remediation:**
```typescript
if (err instanceof AppError) {
  logger.error('Application error:', {
    statusCode: err.statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(err.statusCode).json({
    status: 'error',
    message: err.message,
    // Never include stack traces in production responses
  });
  return;
}
```

---

### 18. Missing Security Headers Configuration

**Severity:** LOW  
**CWE:** CWE-693 (Protection Mechanism Failure)

**Location:**
- `services/api-gateway/src/index.ts:19`
- `services/invoice-service/src/index.ts:17`
- `services/user-service/src/index.ts:24`

**Issue:**
```typescript
app.use(helmet());  // Using defaults without customization
```

While Helmet is used, no explicit CSP, HSTS, or other security headers are configured.

**Impact:**
- XSS attacks
- Clickjacking
- MIME sniffing attacks
- Reduced defense in depth

**Remediation:**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
}));
```

---

## Additional Security Recommendations

### 1. Implement Dependency Scanning
- Add `npm audit` to CI/CD pipeline
- Use Snyk or Dependabot for automated vulnerability scanning
- Regular dependency updates

### 2. Add Static Application Security Testing (SAST)
- Integrate ESLint security plugins
- Use SonarQube or similar tools
- Run security linting in pre-commit hooks

### 3. Implement Dynamic Application Security Testing (DAST)
- Add OWASP ZAP scanning
- Automated penetration testing
- Regular security assessments

### 4. Enable Container Security Scanning
- Scan Docker images for vulnerabilities
- Use Trivy or Clair
- Implement image signing

### 5. Add Secrets Scanning
- Use git-secrets or truffleHog
- Scan for accidentally committed secrets
- Pre-commit hooks to prevent secret commits

### 6. Implement Security Monitoring
- Add SIEM integration
- Real-time threat detection
- Anomaly detection for authentication events
- Alert on suspicious patterns

### 7. Add Penetration Testing
- Regular third-party security audits
- Bug bounty program
- Internal security testing

### 8. Implement WAF (Web Application Firewall)
- CloudFlare or AWS WAF
- Protection against common attacks
- Rate limiting at edge level

### 9. Database Security Hardening
- Enable SSL/TLS for database connections
- Implement database encryption at rest
- Regular database security audits
- Principle of least privilege for database users

### 10. API Security
- Implement API versioning
- Add request signing
- Implement payload validation
- Rate limiting per user/API key
- API usage monitoring

---

## Compliance Considerations

### GDPR
- Ensure PII data encryption
- Implement data retention policies
- Add data export/deletion capabilities
- Document data processing activities

### PCI DSS (if handling payments)
- Never store CVV/CVC
- Tokenize card data
- Implement proper key management
- Regular security testing

### SOC 2
- Implement comprehensive logging
- Access control documentation
- Incident response procedures
- Regular security training

---

## Priority Remediation Plan

### Immediate (Week 1)
1. Fix hardcoded JWT secrets (Issue #1)
2. Fix CORS wildcard configuration (Issue #4)
3. Remove default credentials (Issue #2, #3)
4. Remove Docker socket mount (Issue #5)

### Short-term (Week 2-4)
5. Move access tokens to httpOnly cookies (Issue #6)
6. Implement stronger password policy (Issue #7)
7. Add rate limiting to all endpoints (Issue #9)
8. Implement proper session storage (Issue #10)
9. Add security event logging (Issue #12)

### Medium-term (Month 2-3)
10. Implement proper secret management
11. Add comprehensive input validation
12. Enable all security headers properly
13. Implement HTTPS enforcement
14. Add dependency scanning

### Long-term (Ongoing)
15. Regular security audits
16. Penetration testing
17. Security monitoring and alerting
18. Security training for team
19. Incident response procedures

---

## Conclusion

This security audit has identified 18 real security vulnerabilities that require immediate attention. The most critical issues involve authentication, credential management, and CORS configuration that could lead to complete system compromise if exploited.

**Key Takeaways:**
1. Never use default or hardcoded secrets
2. Implement proper secret management
3. Configure CORS properly with explicit allowed origins
4. Store credentials securely
5. Implement comprehensive logging and monitoring
6. Follow security best practices for authentication
7. Regular security testing and updates

All issues should be addressed according to the priority remediation plan, with critical issues fixed immediately before any production deployment.

---

**Report Generated:** 2024  
**Next Review:** Recommended within 3 months or after major changes
