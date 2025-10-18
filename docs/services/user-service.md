USER SERVICE

Purpose
- Manages user profiles, preferences, organization accounts/teams, invitations, and account lifecycle. Implements GDPR tooling (export/delete) and audit logs.

Key Responsibilities
- CRUD for users and orgs; invitations and membership; profile photos via storage-service.
- Preferences and feature flags at user/org scope with inheritance.
- Emits events for downstream systems (analytics, notifications).

Interfaces
- REST: /users, /orgs, /invitations, /preferences
- Consumes auth-service token introspection for secure user context.

Data
- PostgreSQL (partitioned by tenant or user_id), Redis cache for hot reads.

Security
- Field-level policy checks; PII encryption at rest; privacy-by-design defaults.

Operations
- Backfills for denormalized views, batched migrations, reindexing scripts.
