# Security Configuration

## Password Security

### Hashing Algorithm
- **Algorithm**: bcrypt
- **Cost Factor**: 12 rounds (configurable via `BCRYPT_ROUNDS`)
- **Pepper**: Optional password pepper via `PASSWORD_PEPPER` environment variable for additional security layer

### Password Requirements
- **Minimum Length**: 12 characters
- **Required Character Types**:
  - Lowercase letters (a-z)
  - Uppercase letters (A-Z)
  - Numbers (0-9)
  - Special characters (@$!%*?&)
- **Validation**: Checks against common passwords and predictable patterns
- **Strength Scoring**: Minimum score of 5/10 required

### Account Security
- **Failed Login Attempts**: Maximum 5 attempts before lockout
- **Lockout Duration**: 30 minutes
- **Rate Limiting**: 
  - Global: 100 requests per 15 minutes
  - Auth endpoints: 10 requests per 15 minutes per IP/email combination
- **Timing Attack Protection**: Constant-time password comparison via bcrypt

### Security Features
1. **Password Peppering**: HMAC-SHA256 pepper applied before bcrypt hashing
2. **Account Lockout**: Automatic lockout after failed attempts
3. **Common Password Detection**: Rejects commonly used passwords
4. **Password Entropy Calculation**: Ensures sufficient randomness
5. **CSRF Protection**: Token-based CSRF protection on all state-changing endpoints
6. **Refresh Token Rotation**: Automatic rotation on refresh
7. **Security Audit Endpoint**: Admin-only endpoint for monitoring security metrics

## Environment Variables

### Required
- `JWT_SECRET`: Secret key for access token signing
- `REFRESH_TOKEN_SECRET`: Secret key for refresh token signing

### Optional but Recommended
- `PASSWORD_PEPPER`: Secret pepper value for additional password security
- `NODE_ENV`: Set to 'production' for enhanced security settings

## Security Audit

Administrators can access the security audit endpoint:
- **Endpoint**: `GET /auth/security-audit`
- **Authentication**: Requires admin role
- **Information Provided**:
  - Total users count
  - Locked accounts count and details
  - Accounts with recent failed login attempts
  - Active refresh tokens count
  - Security configuration details

## Resistance to Password Cracking

### John the Ripper / Hashcat Protection
- **bcrypt 12 rounds**: ~0.3 seconds per hash on modern hardware
- **Password pepper**: Requires knowledge of server-side secret
- **Account lockout**: Prevents online brute-force attacks
- **Rate limiting**: Slows down attack attempts
- **Strong password requirements**: Reduces effectiveness of dictionary attacks

### Estimated Crack Times (offline attack with known hash)
- With pepper unknown: Infeasible (cannot crack without pepper)
- With pepper known:
  - 12-character password (mixed): ~centuries with bcrypt 12 rounds
  - 16-character password (mixed): ~millennia

## Best Practices

1. **Set a strong PASSWORD_PEPPER**: Use a cryptographically random 32+ character string
2. **Rotate secrets regularly**: Update JWT secrets and pepper periodically
3. **Monitor security audit**: Regularly check for suspicious activity
4. **Enable production mode**: Set NODE_ENV=production for secure cookies
5. **Use HTTPS**: Always use HTTPS in production to protect tokens in transit
