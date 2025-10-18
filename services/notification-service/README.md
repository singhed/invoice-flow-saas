Notification Service

Responsibilities
- Email/SMS/Push/Webhooks; template rendering; provider management; retries and DLQs; per-tenant rate limits.

APIs
- POST /notifications/send, CRUD /templates, /providers

Data
- PostgreSQL (logs/templates), Redis (dedupe/rate limits), Object storage (assets).
