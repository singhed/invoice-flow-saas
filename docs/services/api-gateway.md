API GATEWAY

Purpose
- Single ingress for all external clients. Handles TLS termination, routing, authn/z delegation, quotas/rate-limits, and schema validation. Implements BFF patterns for web/mobile to minimize client-server round trips.

Key Responsibilities
- Request validation (OpenAPI) and payload size limiting.
- Authentication/Authorization via auth-service (JWT/OIDC) with role- and attribute-based access.
- Rate limiting and quotas (per-tenant, per-IP, per-API key) using Redis token buckets.
- Request tracing and correlation ID propagation (OpenTelemetry).
- Canary/blue-green traffic splitting via service mesh.

Interfaces
- External: HTTPS REST/GraphQL; optional gRPC.
- Internal: mTLS to services over HTTP/2; propagates user/tenant context and authz claims.

Data
- Stateless; uses Redis for short-lived state (rate-limit counters) and caches.

Failure Domains
- Shed load (429) on saturation, circuit-break unhealthy backends, serve cached error responses for known failure modes.

Security
- Strict input validation, header allow-lists, HSTS, CORS controls, WAF integration.

Operations
- Autoscaled by RPS and p99 latency; pod disruption budgets; preStop hooks for connection draining.
