# Enhanced Features: Rate Limiting & S3 Storage

This document describes the enhanced features added to the Expense Management API.

## Rate Limiting

### Overview
The API includes configurable rate limiting to prevent abuse and ensure fair usage across clients.

### Configuration
Rate limiting is configured via environment variables:

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Requests per second (default: 10)
RATE_LIMIT_RPS=10

# Burst size - allows temporary spikes (default: 20)  
RATE_LIMIT_BURST=20
```

### Features
- **Per-IP rate limiting**: Each client IP gets its own rate limit bucket
- **Token bucket algorithm**: Allows for burst traffic up to the burst limit
- **Automatic cleanup**: Inactive clients are automatically removed from memory
- **Custom headers**: Rate limit information in response headers
- **Graceful degradation**: Falls back gracefully when limits are exceeded

### Response Headers
When rate limited, the API returns:
- `429 Too Many Requests` status code
- JSON error response with details
- Rate limit headers (when available)

### Health Check Exemption
Health check endpoints (`/`, `/healthz`) are exempt from rate limiting to ensure monitoring works correctly.

## S3 Storage Integration

### Overview
The API supports both local filesystem storage and Amazon S3 (or S3-compatible services) for file attachments.

### Configuration
S3 storage is configured via environment variables:

```bash
# Required: S3 bucket name
S3_BUCKET=my-expense-attachments

# AWS credentials (use standard AWS credential methods)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Optional: Custom S3 endpoint (for MinIO, etc.)
S3_ENDPOINT=https://s3.example.com

# Optional: Custom prefix for all objects
S3_PREFIX=attachments

# Optional: Public URL base for direct access
S3_PUBLIC_URL=https://cdn.example.com

# Optional: SSL configuration for custom endpoints
S3_USE_SSL=true
```

### Features
- **Automatic fallback**: Falls back to local storage if S3 is misconfigured
- **Organized storage**: Files are organized by expense ID in S3
- **Presigned URLs**: Generate secure, time-limited URLs for file access
- **Public URLs**: Support for CDN/public access patterns
- **S3-compatible services**: Works with MinIO, DigitalOcean Spaces, etc.
- **Automatic cleanup**: Files are properly deleted from S3 when attachments are removed

### Storage Structure
Files in S3 are organized as:
```
bucket/
├── attachments/
│   ├── expense-1/
│   │   ├── 1640995200_receipt.pdf
│   │   └── 1640995300_invoice.jpg
│   ├── expense-2/
│   │   └── 1640995400_document.docx
│   └── ...
```

### Migration Considerations
- **Existing installations**: Will continue using local storage unless S3 is configured
- **Mixed storage**: The system can handle files stored in both local and S3 storage
- **Storage type tracking**: Each attachment record includes a `storage_type` field

## New API Endpoints

### System Information
```
GET /api/system/info
```

Returns information about the API configuration:
```json
{
  "api_version": "1.0.0",
  "storage": {
    "storage_type": "s3",
    "s3_enabled": true
  },
  "rate_limiting": {
    "enabled": true
  },
  "features": [
    "expense_management",
    "file_attachments",
    "ai_suggestions", 
    "s3_storage",
    "rate_limiting"
  ],
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

## Architecture Improvements

### Middleware Layer
- **Rate limiting middleware**: Pluggable rate limiting with multiple strategies
- **CORS middleware**: Enhanced CORS handling
- **Configurable middleware chain**: Easy to add/remove middleware components

### Service Layer Enhancements
- **S3Service**: Complete S3 integration with error handling and fallbacks
- **AttachmentService**: Abstracted storage layer supporting multiple backends
- **Configuration**: Environment-based configuration with sensible defaults

### Error Handling
- **Graceful degradation**: S3 failures fall back to local storage
- **Comprehensive error messages**: Clear error messages for configuration issues
- **Automatic recovery**: System automatically detects and recovers from temporary failures

## Production Deployment

### AWS Deployment
1. Create S3 bucket with appropriate permissions
2. Set up IAM user with S3 access
3. Configure environment variables
4. Deploy API with S3 configuration

### MinIO Deployment
1. Set up MinIO server
2. Create bucket
3. Configure S3_ENDPOINT to point to MinIO
4. Set S3_USE_SSL=false if using HTTP

### Rate Limiting Considerations
- **Load balancing**: Rate limits are per API instance, not global
- **Memory usage**: Rate limiting uses in-memory storage (suitable for moderate traffic)
- **Redis integration**: Can be extended to use Redis for distributed rate limiting

## Monitoring and Observability

### Metrics
The enhanced API provides better observability:
- Storage backend in use (local vs S3)
- Rate limiting status and configuration
- Feature availability

### Health Checks
- S3 connectivity is verified on startup
- Storage backend health is included in system info
- Rate limiting status is reported

### Logging
Enhanced logging includes:
- S3 operations and failures
- Rate limiting events
- Storage backend switches/fallbacks

## Security Considerations

### Rate Limiting
- Prevents DoS attacks
- Ensures fair resource usage
- IP-based limiting (can be extended to user-based)

### S3 Security
- Uses standard AWS IAM permissions
- Supports presigned URLs for secure access
- Can work with private buckets
- Supports custom endpoints for private clouds

### File Upload Security
- File size limits enforced
- Content type validation
- Secure file naming to prevent path traversal
- Storage abstraction prevents direct filesystem access

## Performance Optimization

### S3 Integration
- Streaming uploads/downloads to minimize memory usage
- Concurrent operations for better throughput
- Proper error handling and retry logic

### Rate Limiting
- Efficient token bucket algorithm
- Minimal memory overhead per client
- Automatic cleanup of inactive clients
- Non-blocking rate limit checks

### Caching Considerations
- Presigned URLs can be cached
- S3 URLs support CDN integration
- Local file serving uses proper HTTP caching headers