AUTH SERVICE

Purpose
- Centralized authentication and authorization: OIDC/OAuth2, JWT minting/rotation, session management, MFA, SSO (Google/Microsoft), API keys.

Key Responsibilities
- Issue/verify access and refresh tokens; short-lived access, rotating refresh.
- User/tenant identity, roles/permissions (RBAC/ABAC), policy evaluation, audit events.
- Passwordless login (magic links/WebAuthn), optional password login with Argon2id hashing.

Interfaces
- REST endpoints: /auth/login, /auth/refresh, /auth/logout, /auth/keys, /auth/introspect
- Admin endpoints for role bindings, policy updates, SSO setup.
- Emits domain events to RabbitMQ (user.created, session.revoked).

Data
- PostgreSQL: users, sessions, keys, OAuth clients; Redis: session cache/blacklist; KMS: key encryption.

Security
- Defense-in-depth: device fingerprints, IP reputation, anomaly detection (suspicious logins).

Operations
- Key rotation playbooks, backfill jobs for token invalidation, gray failures tested via chaos experiments.
