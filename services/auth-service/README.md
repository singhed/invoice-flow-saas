Auth Service

Responsibilities
- OIDC/OAuth2 provider, JWT minting and verification, session management, SSO, API keys, role/permission management.

APIs
- POST /auth/login, POST /auth/refresh, POST /auth/logout
- GET /auth/keys, POST /auth/roles, POST /auth/assignments

Storage
- PostgreSQL (users, sessions, roles), Redis (sessions/blacklist), KMS for secrets.

Operational Notes
- Rotation of signing keys, token blacklisting, device bound refresh tokens, audit event emission.
