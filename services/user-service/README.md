User Service

Responsibilities
- User profiles, orgs/teams, invitations, preferences, feature flags, GDPR endpoints, audit logs.

APIs
- CRUD for /users, /orgs, /invitations, /preferences

Storage
- PostgreSQL (partitioned by tenant or user), Redis cache for hot reads.
