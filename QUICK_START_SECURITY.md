# Quick Start - Security Configuration

## 🚨 IMPORTANT: Required Before Running

The codebase now requires proper security configuration. Follow these steps:

---

## Step 1: Generate Secrets

Run these commands to generate secure random secrets:

```bash
# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate REFRESH_TOKEN_SECRET (must be different)
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate database password
node -e "console.log('POSTGRES_PASSWORD=' + require('crypto').randomBytes(24).toString('base64'))"

# Generate Redis password
node -e "console.log('REDIS_PASSWORD=' + require('crypto').randomBytes(24).toString('base64'))"
```

---

## Step 2: Create .env File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` and replace all `REPLACE_WITH_*` values with the secrets you generated.

**Minimum required for development:**

```bash
# Required - Use generated values from Step 1
JWT_SECRET=your_64_character_hex_string_here
REFRESH_TOKEN_SECRET=different_64_character_hex_string_here

# Required for production, optional for local dev
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Required for docker-compose
POSTGRES_PASSWORD=your_strong_password_here
REDIS_PASSWORD=your_redis_password_here

# Optional - defaults to 12
BCRYPT_ROUNDS=12
```

---

## Step 3: Start Services

```bash
# Start with docker-compose (recommended for development)
docker-compose up -d

# Or start services individually
pnpm install
pnpm dev
```

---

## Step 4: Verify Configuration

Test that services start correctly:

```bash
# Check API Gateway
curl http://localhost:3000/health

# Check User Service  
curl http://localhost:3003/health

# Check Invoice Service
curl http://localhost:3002/health
```

---

## ⚠️ Common Errors and Solutions

### Error: "JWT_SECRET environment variable is required"
**Solution:** You forgot to set JWT_SECRET in .env file

### Error: "JWT_SECRET must be at least 32 characters"
**Solution:** Generate a proper secret using the command in Step 1

### Error: "ALLOWED_ORIGINS must be configured in production"
**Solution:** Set ALLOWED_ORIGINS in .env file or set NODE_ENV=development

### Error: "POSTGRES_PASSWORD must be set"
**Solution:** Set POSTGRES_PASSWORD in .env file

---

## 🔐 Security Features Enabled

After configuration, you have:

- ✅ Strong JWT authentication (32+ character secrets)
- ✅ Strict CORS validation
- ✅ Rate limiting on all endpoints
- ✅ Strong password requirements (12+ chars, complexity)
- ✅ Bcrypt with 12 rounds
- ✅ Input sanitization
- ✅ Security headers (CSP, HSTS)
- ✅ Protected API documentation
- ✅ Secure database credentials

---

## 🧪 Testing Authentication

### Register a new user:
```bash
# Get CSRF token first
curl -c cookies.txt http://localhost:3003/auth/csrf-token

# Register with strong password
curl -b cookies.txt -c cookies.txt \
  -X POST http://localhost:3003/auth/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token-from-previous-response>" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Note:** Password must have:
- At least 12 characters
- Uppercase letters
- Lowercase letters
- Numbers
- Special characters (@$!%*?&)

---

## 📚 Documentation

For detailed information, see:

- `SECURITY_AUDIT_REPORT.md` - Full security analysis
- `SECURITY_ISSUES_SUMMARY.md` - Quick reference
- `SECURITY_FIXES_EXAMPLES.md` - Code examples
- `SECURITY_FIXES_APPLIED.md` - Implementation details

---

## 🚀 Production Deployment

For production, additionally configure:

1. **ALLOWED_ORIGINS** - Your actual domain(s)
2. **HTTPS** - Configure at load balancer level
3. **Secrets Management** - Use AWS Secrets Manager or similar
4. **Monitoring** - Set up security alerts
5. **Backups** - Configure automated backups

See `SECURITY_FIXES_APPLIED.md` for complete production checklist.

---

## 🆘 Need Help?

1. Check error messages - they're descriptive
2. Review .env.example for all available options
3. Ensure all secrets are 32+ characters
4. Verify .env file exists and is not committed to Git
5. Check that Docker services are running

---

**Security First! 🔒**
