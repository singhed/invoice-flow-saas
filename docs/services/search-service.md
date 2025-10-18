SEARCH SERVICE

Purpose
- Full-text search, faceting, autocomplete/suggestions, relevance tuning, and indexing pipeline management.

Key Responsibilities
- Indexer: consumes change events (outbox -> RabbitMQ) and writes to Elasticsearch.
- Query API: relevance-tuned search with filters, aggregations, highlighting, and spell correction.
- Synonyms, stop-words, language analyzers per locale; personalization hooks.

Interfaces
- REST: /search, /suggest
- Internal: /indexer/rebuild, /indexer/retry-failed

Data
- Elasticsearch indices with ILM policies; S3/GCS snapshots; optional Redis for hot query caches.

Operations
- Rolling index schema migrations with dual writes and shadow reads; backfill jobs; hot/warm/cold tiers.
