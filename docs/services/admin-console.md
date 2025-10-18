ADMIN CONSOLE

Purpose
- Internal web application for operators, support, and administrators to manage tenants, users, roles, feature flags, notifications, search relevance, and platform configuration.

Key Capabilities
- RBAC-aware UI; only expose permitted actions based on user roles/claims from auth-service.
- Tenant operations: suspend/reactivate, quotas, usage analytics.
- User management: invites, resets, MFA enforcement, audit trails.
- Notification templates and providers configuration with live previews.
- Search tuning: synonyms, boosts, A/B experiments on ranking.
- Runtime controls: feature flags, kill switches, config rollouts.

Tech Stack
- Next.js, TypeScript, Tailwind; React Query; OpenAPI-driven clients; OIDC auth.

Security
- Strict session handling, step-up auth for sensitive actions, full audit logging; separated admin domain and stricter CSP.
