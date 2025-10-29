# AI Service - Smart Invoice Generator

AI-powered invoice generation service using Grok API (with OpenAI fallback) for automatic invoice creation from natural language or document uploads.

## Features

- 🤖 **Natural Language Processing**: Generate invoices from plain text descriptions
- 📄 **Document Upload**: Extract data from PDF invoices and receipts
- 🖼️ **OCR Support**: Process images (JPG, PNG, TIFF) with Tesseract.js
- ✅ **Data Validation**: Zod schema validation for AI-generated data
- 🔄 **Dual AI Provider**: Grok API primary, OpenAI fallback
- 📊 **Confidence Scoring**: AI confidence metrics for each extraction
- 🛡️ **Secure**: Rate limiting, CORS protection, file size limits

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Grok API key (https://x.ai/) or OpenAI API key

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment variables
cp ../../.env.example ../../.env

# Add your API keys to .env
GROK_API_KEY=your_grok_api_key_here
# OR
OPENAI_API_KEY=your_openai_api_key_here

# Start the service
pnpm dev
```

The service will start on `http://localhost:3009`

## API Endpoints

### POST `/ai/generate-invoice`

Generate an invoice from text or file upload.

**Text Input Request:**
```bash
curl -X POST http://localhost:3009/ai/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Invoice Acme Corp for 5 hours of web development at $150/hr plus $200 hosting. Add 8.5% tax. Due in 30 days."
  }'
```

**File Upload Request:**
```bash
curl -X POST http://localhost:3009/ai/generate-invoice \
  -F "file=@invoice.pdf"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "customer": {
      "name": "Acme Corp",
      "email": "billing@acme.com",
      "address": "123 Main St, NYC, NY 10001"
    },
    "invoice": {
      "number": "INV-202410-001",
      "date": "2024-10-29",
      "dueDate": "2024-11-28",
      "currency": "USD",
      "subtotal": 950.00,
      "taxRate": 0.085,
      "taxAmount": 80.75,
      "total": 1030.75,
      "notes": "Payment terms: Net 30"
    },
    "lineItems": [
      {
        "description": "Website Development - 5 hours",
        "quantity": 5,
        "unitPrice": 150,
        "total": 750
      },
      {
        "description": "Monthly Hosting",
        "quantity": 1,
        "unitPrice": 200,
        "total": 200
      }
    ],
    "confidence": 0.95
  }
}
```

### GET `/ai/health`

Health check endpoint.

```bash
curl http://localhost:3009/ai/health
```

### GET `/ai/config`

Get service configuration and capabilities.

```bash
curl http://localhost:3009/ai/config
```

## Configuration

Environment variables (add to `.env`):

```bash
# AI Service
AI_SERVICE_PORT=3009

# API Keys (at least one required)
GROK_API_KEY=your_grok_api_key
OPENAI_API_KEY=your_openai_api_key

# API URLs (optional - defaults provided)
GROK_API_URL=https://api.x.ai/v1/chat/completions
OPENAI_API_URL=https://api.openai.com/v1/chat/completions

# AI Configuration
AI_MODEL=grok-beta
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.3
AI_CONFIDENCE_THRESHOLD=0.7
MAX_FILE_SIZE_MB=10
```

## Supported File Types

- **PDF**: `.pdf` (text extraction via pdf-parse)
- **Images**: `.jpg`, `.jpeg`, `.png`, `.tiff`, `.tif` (OCR via Tesseract.js)
- **Text**: Plain text via JSON body

## AI Prompt Engineering

The service uses a carefully crafted prompt to ensure consistent, high-quality invoice extraction:

```
Extract a COMPLETE, professional invoice from this text/email/PDF. 
Be precise, infer missing details logically (e.g., today's date, 
standard 8.5% tax if US, net30 terms).

Rules:
- MUST return valid JSON only
- confidence: 1.0 = perfect match, 0.5 = heavy inference
- Auto-generate invoice number in format YYYYMM-XXX
- Use today's date if not specified
- Add 30 days for due date if not specified
- Include at least 1 line item
- Calculate totals accurately
```

## Cost Optimization

- **Grok API**: ~$0.01 per invoice (2000 tokens average)
- **OpenAI GPT-4**: ~$0.02 per invoice
- **File Processing**: Free (local processing)

Average processing time: 2-5 seconds per invoice.

## Error Handling

The service includes comprehensive error handling:

- **Low Confidence**: Warns when AI confidence < 70%
- **Invalid Data**: Zod validation catches malformed responses
- **File Errors**: Proper error messages for unsupported formats
- **API Failures**: Automatic fallback from Grok to OpenAI

## Development

```bash
# Run in development mode
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run tests
pnpm test
```

## Production Deployment

### Docker

```bash
# Build image
pnpm docker:build

# Run container
docker run -p 3009:3009 \
  -e GROK_API_KEY=your_key \
  invoice-saas-ai-service:latest
```

### Kubernetes

Add to your existing Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: invoice-saas-ai-service:latest
        ports:
        - containerPort: 3009
        env:
        - name: GROK_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: grok-api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Integration with Invoice Service

To integrate with the existing invoice service:

1. **Generate invoice** using AI service
2. **Review/edit** in frontend
3. **Save** via invoice service API:

```typescript
// After AI generation and user review
const aiInvoice = await fetch('http://ai-service:3009/ai/generate-invoice', {
  method: 'POST',
  body: JSON.stringify({ input: userText })
});

// Save to invoice service
const savedInvoice = await fetch('http://invoice-service:3002/invoices', {
  method: 'POST',
  body: JSON.stringify({
    customerId: aiInvoice.customer.id,
    lineItems: aiInvoice.lineItems,
    total: aiInvoice.invoice.total,
    dueDate: aiInvoice.invoice.dueDate,
    // ... other fields
  })
});
```

## Monitoring

Key metrics to monitor:

- API call success rate
- Average confidence scores
- Processing time per invoice
- Error rates by file type
- API costs (Grok/OpenAI usage)

## Security

- ✅ Rate limiting (50 requests per 15 minutes)
- ✅ File size limits (10MB default)
- ✅ CORS protection
- ✅ Input validation
- ✅ Secure API key handling
- ✅ No PII logging

## Troubleshooting

### "No AI API keys configured"
- Add either `GROK_API_KEY` or `OPENAI_API_KEY` to your `.env` file

### "Failed to extract text from PDF"
- Ensure PDF contains extractable text (not scanned images)
- Try converting scanned PDFs to images and use OCR instead

### "Low confidence extraction"
- Provide more detailed input
- Include specific amounts, dates, and customer info
- Review and edit the generated invoice before saving

### "File too large"
- Increase `MAX_FILE_SIZE_MB` in config
- Compress large PDFs before upload
- Use text extraction for very large documents

## Future Enhancements

- [ ] Multi-language support
- [ ] Batch processing for multiple invoices
- [ ] Custom prompt templates per company
- [ ] Learning from user corrections
- [ ] Direct integration with accounting software
- [ ] Invoice template customization
- [ ] Historical data analysis for better inference

## License

MIT License - See [LICENSE](../../LICENSE) for details.

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/singhed/invoice-flow-saas/issues)
- Documentation: [Full docs](../../docs/README.md)
