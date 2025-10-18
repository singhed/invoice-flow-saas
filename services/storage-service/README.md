Storage Service

Responsibilities
- Signed URL generation, antivirus/DLP scanning, lifecycle policies, metadata extraction, cross-region replication.

APIs
- POST /storage/sign, GET/PUT /storage/metadata, webhooks for scan results.

Data
- S3/GCS buckets, PostgreSQL (metadata), Redis (upload sessions).
