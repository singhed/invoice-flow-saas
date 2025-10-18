Admin Console (Next.js)

Purpose
- Internal console for SRE/Support/Admins to manage tenants, users, roles, feature flags, templates, providers, search relevance, and runtime configuration.

Tech Stack
- Next.js, TypeScript, Tailwind, React Query, OpenAPI client, OIDC login against auth-service, RBAC-aware UI controls.

Security
- Enforced OIDC login with step-up authentication for sensitive operations. Strict audit logs and session timeouts.

Deployment
- Same CI as web; separate app with its own environment variables and rollout policy.
