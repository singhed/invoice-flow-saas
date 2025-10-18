ANALYTICS SERVICE

Purpose
- Event ingestion and aggregation, attribution, funnels, cohorts, retention analytics; export to OLAP/warehouse.

Key Responsibilities
- Ingest events via REST/Batch; push to RabbitMQ for async processing.
- Real-time aggregations for dashboards; long-running batch jobs for cohorts/funnels.
- Data contracts for schema evolution; backfills with idempotency keys.

Interfaces
- REST: /events, /metrics/*
- Async: consumes RabbitMQ topics (domain events), optional connectors to Kafka for high-throughput.

Data
- PostgreSQL for aggregates and metadata; cold storage to S3/GCS; OLAP optional (BigQuery/Snowflake/ClickHouse).

Operations
- Shield heavy queries behind materialized views; data retention windows; privacy (pseudonymization).
