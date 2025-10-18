NOTIFICATION SERVICE

Purpose
- Reliable, multi-channel messaging: email, SMS, push, and webhooks; tenant-level templates, branding, and rate limits.

Key Responsibilities
- Template rendering (MJML/Handlebars) with localization and brand assets.
- Providers: SES/SendGrid (email), Twilio (SMS), FCM/APNs (push), signed webhooks with retries.
- Retry with exponential backoff, DLQs, idempotent processing, deduplication.

Interfaces
- REST: /notifications/send, /templates, /providers
- Async: RabbitMQ exchanges for fanout and worker queues.

Data
- PostgreSQL: message logs, templates, provider configs; Redis: dedupe/rate limit; Object storage: assets.

Operations
- Canary providers, delivery reports aggregation, complaint/bounce handling, GDPR retention policies.
