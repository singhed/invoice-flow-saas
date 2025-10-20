AUTH SERVICE

Purpose
- Centralized authentication and authorization. This implementation provides a pragmatic JWT-based auth suitable for local development and demos. It issues and verifies JWT access tokens and exposes minimal user endpoints.

Key Responsibilities
- Issue/verify access tokens
- Basic user registration and login with secure password hashing (bcrypt)
- Role support (default: user)
- Per-IP and per-identity rate limiting on auth endpoints

Interfaces
- REST endpoints (served via API Gateway under the /api prefix):
  - GET /auth/csrf-token → Issue a CSRF token (required for subsequent POSTs)
  - POST /auth/register → Create a new user and return a JWT
  - POST /auth/login → Authenticate user and return a JWT
  - GET /auth/me → Return the authenticated user

Authentication
- Access Token: JWT (HS256) signed with JWT_SECRET. Provide in Authorization: Bearer <token>. Default expiration: 15 minutes
- Refresh Token: JWT (HS256) signed with REFRESH_TOKEN_SECRET, issued as HttpOnly SameSite=Lax cookie named `rt` scoped to `/api/auth`. Default expiration: 7 days. Rotated on each refresh.

Rate Limiting
- Global: 100 req / 15 min per IP
- Auth endpoints: 10 req / 15 min per IP+email combination
- Error: HTTP 429 with message "Too many auth attempts, please try again later."

Environment Variables
- JWT_SECRET: Secret for signing JWTs (required for both API Gateway and Auth/User Service)
- PORT: Service port (default 3003)
- ALLOWED_ORIGINS: CORS allowlist (comma-separated)

Local Development
- Start API Gateway: pnpm --filter @invoice-saas/api-gateway dev
- Start User Service: pnpm --filter @invoice-saas/user-service dev
- Frontend (Next.js): pnpm --filter web dev

Example Requests
- Register
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"SecurePassword123!","name":"Jane"}'

- CSRF Token
  curl -X GET http://localhost:3000/api/auth/csrf-token \
    -H "Accept: application/json" -i

- Login
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: <token-from-previous-step>" \
    -d '{"email":"user@example.com","password":"SecurePassword123!"}'

- Me
  curl http://localhost:3000/api/auth/me \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"

- Refresh Access Token (requires `rt` cookie)
  curl -X POST http://localhost:3000/api/auth/refresh \
    -H "X-CSRF-Token: <token-from-/auth/csrf-token>"

- Logout (revokes refresh token and clears cookie)
  curl -X POST http://localhost:3000/api/auth/logout \
    -H "X-CSRF-Token: <token-from-/auth/csrf-token>"

Notes
- This service uses an in-memory user store for simplicity; restart clears users.
- For production, replace with a persistent database (e.g., Postgres via Prisma), add refresh tokens and password reset flows.
