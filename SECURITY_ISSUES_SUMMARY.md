# Security Issues Summary - Quick Reference

## Critical Issues (Fix Immediately)

### 🔴 1. Hardcoded JWT Secrets
**Files:** 
- `services/api-gateway/src/middleware/auth.ts:5`
- `services/user-service/src/index.ts:20-21`

**Problem:** Weak fallback secrets like `'your-secret-key'`

**Quick Fix:**
```typescript
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
if (!ACCESS_TOKEN_SECRET) {
  throw new Error('JWT_SECRET must be configured');
}
```

---

### 🔴 2. CORS Wildcard with Credentials
**Files:**
- `services/api-gateway/src/index.ts:23`
- `services/invoice-service/src/index.ts:26`
- `services/user-service/src/index.ts:28`

**Problem:** `origin: '*'` when ALLOWED_ORIGINS is empty, but `credentials: true`

**Quick Fix:**
```typescript
if (allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must be configured');
}
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
```

---

### 🔴 3. Hardcoded Kubernetes Secrets
**Files:**
- `infrastructure/kubernetes/base/secrets.yaml`

**Problem:** Placeholder passwords committed to Git

**Quick Fix:**
- Remove this file from Git
- Use External Secrets Operator or AWS Secrets Manager
- Add to .gitignore

---

### 🔴 4. Weak Database Credentials
**Files:**
- `docker-compose.yml:10-12`

**Problem:** `POSTGRES_PASSWORD: postgres`

**Quick Fix:**
```yaml
environment:
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  POSTGRES_DB: ${POSTGRES_DB}
```
Then set in `.env` (not committed)

---

### 🔴 5. Docker Socket Exposed
**Files:**
- `docker-compose.yml:48`

**Problem:** `/var/run/docker.sock` mounted

**Quick Fix:**
Remove the line or use Docker-in-Docker

---

### 🔴 6. Access Token in Response Body
**Files:**
- `services/user-service/src/index.ts:194, 230, 313`

**Problem:** Tokens in JSON response (XSS vulnerable)

**Quick Fix:**
Store in httpOnly cookie instead:
```typescript
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000
});
res.json({ status: 'success', user: {...} });
```

---

## High Priority Issues

### 🟠 7. Weak Password Policy
**File:** `services/user-service/src/index.ts:124-129`

**Problem:** Only requires 8 chars + letters + numbers

**Quick Fix:**
```typescript
.min(12)
.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
```

---

### 🟠 8. Bcrypt Work Factor Too Low
**File:** `services/user-service/src/index.ts:168`

**Problem:** Only 10 rounds

**Quick Fix:**
```typescript
const passwordHash = await bcrypt.hash(password, 12);
```

---

### 🟠 9. No Rate Limiting on Health Endpoints
**Files:** Multiple services

**Quick Fix:**
```typescript
const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
app.use('/health', healthLimiter, healthRoutes);
```

---

### 🟠 10. In-Memory Session Storage
**File:** `services/user-service/src/index.ts:58-62`

**Problem:** Data lost on restart, can't scale horizontally

**Quick Fix:**
Use Redis for session storage

---

### 🟠 11. Missing Input Sanitization
**File:** `services/invoice-service/src/routes/invoiceRoutes.ts:16`

**Problem:** No HTML sanitization for personalMessage

**Quick Fix:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

personalMessage: Joi.string()
  .max(1500)
  .custom((value) => DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }))
```

---

### 🟠 12. No Security Event Logging
**File:** `services/user-service/src/index.ts:200-234`

**Problem:** Failed logins not logged

**Quick Fix:**
```typescript
logger.warn('Failed login attempt', {
  email: normalizedEmail,
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

---

### 🟠 13. Public API Documentation
**File:** `services/api-gateway/src/index.ts:63-68`

**Problem:** Swagger docs exposed without auth

**Quick Fix:**
```typescript
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
```

---

## Medium Priority Issues

### 🟡 14. CSRF Token Bypass
**File:** `services/api-gateway/src/index.ts:52-61`

**Problem:** Origin check bypassed with Authorization header

**Quick Fix:**
Always validate origin for state-changing operations

---

### 🟡 15. Missing HTTPS Enforcement
**Files:** Multiple services

**Problem:** Secure cookies only in production

**Quick Fix:**
```typescript
app.use((req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
});
```

---

### 🟡 16. Loose File Name Sanitization
**File:** `services/invoice-service/src/routes/invoiceRoutes.ts:39-47`

**Problem:** Allows '#' in filenames

**Quick Fix:**
```typescript
return order.name.replace(/[^a-zA-Z0-9-_]/g, '-');
```

---

## Low Priority Issues

### ⚪ 17. Verbose Error Messages
**Files:** Error handlers

**Quick Fix:**
Don't send stack traces to client in production

---

### ⚪ 18. Missing Security Headers
**Files:** Multiple services

**Quick Fix:**
Configure Helmet properly with CSP, HSTS, etc.

---

## Checklist for Production Deployment

- [ ] Generate strong JWT secrets (256-bit random)
- [ ] Configure ALLOWED_ORIGINS explicitly
- [ ] Remove all hardcoded credentials
- [ ] Use external secret management (AWS Secrets Manager)
- [ ] Remove Docker socket mount
- [ ] Move tokens to httpOnly cookies
- [ ] Strengthen password policy to 12+ chars with complexity
- [ ] Increase bcrypt rounds to 12
- [ ] Add rate limiting to all endpoints
- [ ] Implement Redis for session storage
- [ ] Add comprehensive security logging
- [ ] Configure Helmet with strict CSP
- [ ] Enable HTTPS enforcement
- [ ] Disable public API documentation
- [ ] Add dependency vulnerability scanning
- [ ] Enable database SSL/TLS
- [ ] Implement secrets rotation policy
- [ ] Add security monitoring/alerting
- [ ] Conduct penetration testing
- [ ] Create incident response plan

---

## Files That Need Immediate Attention

1. `services/api-gateway/src/middleware/auth.ts`
2. `services/user-service/src/index.ts`
3. `services/api-gateway/src/index.ts`
4. `services/invoice-service/src/index.ts`
5. `docker-compose.yml`
6. `infrastructure/kubernetes/base/secrets.yaml` (DELETE)
7. `.env.example` (update with warnings)

---

## Security Commands to Run

```bash
# Check for secrets in Git history
git log --all --full-history --source -- *secret* *password* *key*

# Scan dependencies
npm audit
pnpm audit

# Check for hardcoded secrets
grep -r "password\|secret\|token" --include="*.ts" --include="*.js" .

# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Check Docker images for vulnerabilities
docker scan <image-name>
```

---

## Environment Variables That Must Be Set

```bash
# Critical - Must be set before deployment
JWT_SECRET=<256-bit-random-hex>
REFRESH_TOKEN_SECRET=<256-bit-random-hex>
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database
POSTGRES_USER=<secure-username>
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=invoicedb

# AWS
AWS_SES_ACCESS_KEY_ID=<from-aws>
AWS_SES_SECRET_ACCESS_KEY=<from-aws>
AWS_SES_FROM_EMAIL=<verified-email>

# Shopify
SHOPIFY_STORE_DOMAIN=<your-store>.myshopify.com
SHOPIFY_ACCESS_TOKEN=<from-shopify>
```

---

## Testing Security Fixes

```bash
# Test CORS
curl -H "Origin: http://evil.com" -I http://localhost:3000/api/auth/login

# Test rate limiting
for i in {1..20}; do curl http://localhost:3000/api/auth/login; done

# Test authentication
curl -H "Authorization: Bearer invalid" http://localhost:3000/api/users

# Test input validation
curl -X POST http://localhost:3000/api/invoices/email \
  -H "Content-Type: application/json" \
  -d '{"orderId": "<script>alert(1)</script>"}'
```

---

## Next Steps

1. **Immediate** (Today): Fix critical issues #1-6
2. **This Week**: Address high priority issues #7-13
3. **This Month**: Implement medium priority fixes #14-16
4. **Ongoing**: Security monitoring, testing, updates

**DO NOT DEPLOY TO PRODUCTION** until at least critical issues are resolved.

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Report Date:** 2024  
**Severity Legend:**  
🔴 Critical | 🟠 High | 🟡 Medium | ⚪ Low
