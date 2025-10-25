# Payment Service

This service handles payment lifecycle operations (creation, status tracking, and reconciliation metadata) independently from the invoice service. It exposes a REST API for managing payment records and tracking their timeline events.

## Available Endpoints

- `GET /health` – Service healthcheck.
- `GET /payments` – List payments with optional filtering by status or invoice ID.
- `POST /payments` – Create a new payment record.
- `GET /payments/:paymentId` – Retrieve a payment by its identifier.
- `GET /payments/:paymentId/timeline` – Inspect the lifecycle events for a payment.
- `POST /payments/:paymentId/status` – Update payment status with validation of allowed transitions.
- `PATCH /payments/:paymentId/metadata` – Merge additional reconciliation metadata.

All routes return JSON responses and leverage the shared error-handling utilities in `@invoice-saas/shared`.
