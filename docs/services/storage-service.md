STORAGE SERVICE

Purpose
- Unified, secure access to object storage with signed URLs, content scanning, lifecycle policies, and metadata.

Key Responsibilities
- Generate signed upload/download URLs; multipart uploads for large files.
- Antivirus/DLP scanning pipeline; quarantine workflows; metadata extraction.
- Lifecycle policies: tiering, retention, cross-region replication.

Interfaces
- REST: /storage/sign, /storage/metadata, /storage/scan
- Webhooks for async scan results.

Data
- S3/GCS buckets with bucket policies; PostgreSQL for metadata; Redis for ephemeral upload sessions.

Operations
- Per-tenant buckets/prefixes; KMS-managed keys; bandwidth controls; egress cost optimization (CDN).
