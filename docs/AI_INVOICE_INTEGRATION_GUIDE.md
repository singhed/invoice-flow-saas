# AI Invoice Integration Guide

This guide explains how to integrate the AI-powered invoice generation feature into your existing invoice management workflow.

## Overview

The AI service provides a REST API that generates structured invoice data from:
- Natural language text descriptions
- PDF documents (invoices, receipts, purchase orders)
- Images (scanned receipts, photographed invoices)

The frontend provides a user-friendly interface for:
- Inputting text or uploading files
- Previewing generated invoices
- Editing all fields before saving
- Creating invoices in the system

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Web UI    │────────▶│ AI Service  │────────▶│  Grok/OpenAI │
│  /ai-invoice│         │  Port 3009  │         │     API      │
└─────────────┘         └─────────────┘         └──────────────┘
       │                       │
       │                       ▼
       │                ┌─────────────┐
       │                │ OCR/PDF     │
       │                │ Processing  │
       │                └─────────────┘
       │
       ▼
┌─────────────┐
│  Invoice    │
│  Service    │
│  Port 3002  │
└─────────────┘
```

## Setup

### 1. Get API Keys

**Option A: Grok API (Recommended)**
1. Visit https://x.ai/
2. Sign up for an account
3. Generate an API key
4. Add to `.env`: `GROK_API_KEY=your_key_here`

**Option B: OpenAI API**
1. Visit https://platform.openai.com/
2. Sign up and add billing
3. Generate an API key
4. Add to `.env`: `OPENAI_API_KEY=your_key_here`

### 2. Configure Environment

Add to your `.env` file:

```bash
# AI Service
AI_SERVICE_PORT=3009
GROK_API_KEY=your_grok_key_here
# OR
OPENAI_API_KEY=your_openai_key_here

# Frontend
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:3009

# Optional: Customize AI behavior
AI_MODEL=grok-beta
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.3
AI_CONFIDENCE_THRESHOLD=0.7
MAX_FILE_SIZE_MB=10
```

### 3. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Or install AI service only
pnpm --filter @invoice-saas/ai-service install
```

### 4. Start Services

```bash
# Start all services (includes AI service)
pnpm dev

# Or start AI service only
pnpm --filter @invoice-saas/ai-service dev

# Verify service is running
curl http://localhost:3009/ai/health
```

## Usage

### Web Interface

1. Navigate to `http://localhost:3001/ai-invoice`
2. Choose input method:
   - **Text Input**: Describe the invoice in natural language
   - **File Upload**: Drag and drop PDF or image
3. Click "Generate Invoice"
4. Review the generated invoice
5. Click "Edit Invoice" to modify any fields
6. Click "Save & Create Invoice" to save

### API Integration

#### Generate from Text

```bash
curl -X POST http://localhost:3009/ai/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Invoice Acme Corp (billing@acme.com) for 5 hours of consulting at $150/hr. Add 8.5% tax. Due in 30 days."
  }'
```

#### Generate from File

```bash
curl -X POST http://localhost:3009/ai/generate-invoice \
  -F "file=@invoice.pdf"
```

#### Response Format

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
      "subtotal": 750.00,
      "taxRate": 0.085,
      "taxAmount": 63.75,
      "total": 813.75,
      "notes": "Payment terms: Net 30"
    },
    "lineItems": [
      {
        "description": "Consulting Services - 5 hours",
        "quantity": 5,
        "unitPrice": 150,
        "total": 750
      }
    ],
    "confidence": 0.95
  }
}
```

## Integration with Invoice Service

After generating an invoice with AI, save it to the invoice service:

```typescript
// 1. Generate invoice with AI
const aiResponse = await fetch('http://localhost:3009/ai/generate-invoice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: userText })
});

const { data: aiInvoice } = await aiResponse.json();

// 2. User reviews and edits in UI
// (Frontend handles this)

// 3. Save to invoice service
const savedInvoice = await fetch('http://localhost:3002/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    customerName: aiInvoice.customer.name,
    customerEmail: aiInvoice.customer.email,
    customerAddress: aiInvoice.customer.address,
    invoiceNumber: aiInvoice.invoice.number,
    issueDate: aiInvoice.invoice.date,
    dueDate: aiInvoice.invoice.dueDate,
    currency: aiInvoice.invoice.currency,
    lineItems: aiInvoice.lineItems,
    subtotal: aiInvoice.invoice.subtotal,
    taxRate: aiInvoice.invoice.taxRate,
    taxAmount: aiInvoice.invoice.taxAmount,
    total: aiInvoice.invoice.total,
    notes: aiInvoice.invoice.notes
  })
});
```

## Best Practices

### Input Quality

For best results, include:

✅ **Customer Details**
- Full name or company name
- Email address
- Physical address

✅ **Line Items**
- Clear descriptions
- Quantities
- Unit prices
- Use standard units (hours, units, months)

✅ **Financial Details**
- Currency (USD, EUR, GBP, etc.)
- Tax rates
- Payment terms

✅ **Dates**
- Invoice date
- Due date
- Payment terms (Net 30, Net 60, etc.)

### Example Inputs

**Good Input:**
```
Invoice Acme Corp (billing@acme.com, 123 Main St, NYC, NY 10001) 
for:
- Website development: 10 hours @ $150/hr
- Logo design: 1 unit @ $500
- Monthly hosting: 1 month @ $99

Add 8.5% sales tax.
Payment due in 30 days.
Note: 50% deposit already paid.
```

**Poor Input:**
```
Invoice for work done
```

### Confidence Scores

- **0.9 - 1.0**: Excellent - All details extracted accurately
- **0.7 - 0.9**: Good - Minor inference, review recommended
- **0.5 - 0.7**: Fair - Significant inference, editing required
- **< 0.5**: Poor - Low quality extraction, manual entry recommended

### Error Handling

```typescript
try {
  const response = await fetch('/ai/generate-invoice', {
    method: 'POST',
    body: JSON.stringify({ input: userText })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const { data } = await response.json();

  // Check confidence
  if (data.confidence < 0.7) {
    console.warn('Low confidence extraction, review carefully');
  }

  // Validate required fields
  if (!data.customer.email) {
    console.warn('Missing customer email');
  }

  return data;
} catch (error) {
  console.error('AI invoice generation failed:', error);
  // Fallback to manual form
  return null;
}
```

## Performance Optimization

### Caching

For repeated similar invoices, cache common patterns:

```typescript
const cacheKey = `invoice_${customerId}_${JSON.stringify(lineItems)}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const generated = await generateInvoice(input);
await redis.setex(cacheKey, 3600, JSON.stringify(generated)); // 1 hour cache
return generated;
```

### Batch Processing

For multiple invoices:

```typescript
const invoices = await Promise.all(
  files.map(file => 
    fetch('/ai/generate-invoice', {
      method: 'POST',
      body: formData(file)
    })
  )
);
```

### Rate Limiting

Current limits:
- 50 requests per 15 minutes per IP
- Adjust in `services/ai-service/src/index.ts` if needed

## Monitoring

### Key Metrics

Monitor these in production:

1. **Success Rate**: % of successful generations
2. **Average Confidence**: Mean confidence score
3. **Processing Time**: Time to generate invoice
4. **Error Rate**: % of failed requests
5. **API Costs**: Grok/OpenAI usage costs

### Example Monitoring

```typescript
// Log metrics after each generation
logger.info('AI invoice generated', {
  confidence: result.confidence,
  lineItemCount: result.lineItems.length,
  total: result.invoice.total,
  processingTime: Date.now() - startTime,
  provider: 'grok' // or 'openai'
});
```

## Troubleshooting

### Service Not Starting

**Error**: "No AI API keys configured"
- Solution: Add `GROK_API_KEY` or `OPENAI_API_KEY` to `.env`

**Error**: Port 3009 already in use
- Solution: Change `AI_SERVICE_PORT` in `.env` or kill process on port 3009

### Low Extraction Quality

**Problem**: Confidence scores < 0.7
- Solution: Provide more detailed input
- Include customer email and address
- Specify exact amounts and dates
- Use clear, structured language

### File Upload Issues

**Error**: "Failed to extract text from PDF"
- Solution: PDF may be scanned image
- Convert to image and use OCR instead
- Ensure PDF has selectable text

**Error**: "File too large"
- Solution: Compress file or increase `MAX_FILE_SIZE_MB`

### API Timeout

**Error**: Request timeout after 30 seconds
- Solution: Large files may take longer
- Increase timeout in client
- Use text extraction pre-processing

## Security Considerations

### API Key Management

- Store API keys in environment variables only
- Never commit keys to version control
- Use secrets management in production (AWS Secrets Manager, etc.)
- Rotate keys regularly

### Input Validation

- File size limits enforced (10MB default)
- File type validation (PDF, images only)
- Text input length limits (10,000 chars)
- Sanitize all user inputs

### Data Privacy

- No invoice data is sent to AI providers beyond generation request
- No PII is logged in service logs
- Consider end-to-end encryption for sensitive invoices
- Comply with GDPR/CCPA requirements

### Rate Limiting

- Per-IP rate limiting prevents abuse
- Consider per-user limits in production
- Monitor for unusual patterns
- Implement circuit breakers for AI API failures

## Cost Management

### Estimated Costs

**Grok API:**
- ~$0.01 per invoice (2000 tokens average)
- $1.00 per 100 invoices
- $10.00 per 1000 invoices

**OpenAI GPT-4:**
- ~$0.02 per invoice
- $2.00 per 100 invoices
- $20.00 per 1000 invoices

### Cost Optimization

1. **Use Grok as primary provider** (lower cost)
2. **Cache common invoice patterns**
3. **Batch process when possible**
4. **Set confidence thresholds** to avoid retries
5. **Monitor and alert on unusual usage**

### Budget Alerts

```typescript
// Track monthly costs
let monthlyInvoiceCount = 0;
const COST_PER_INVOICE = 0.01; // Grok
const MONTHLY_BUDGET = 100; // $100

if (monthlyInvoiceCount * COST_PER_INVOICE > MONTHLY_BUDGET) {
  logger.warn('AI budget exceeded', {
    currentCost: monthlyInvoiceCount * COST_PER_INVOICE,
    budget: MONTHLY_BUDGET
  });
  // Send alert to admin
}
```

## Future Enhancements

Planned improvements:

- [ ] Multi-language support (Spanish, French, German, etc.)
- [ ] Bulk upload and processing
- [ ] Learning from user corrections
- [ ] Custom prompt templates per company
- [ ] Integration with accounting software (QuickBooks, Xero)
- [ ] Invoice template customization
- [ ] Recurring invoice patterns
- [ ] Historical data analysis
- [ ] Mobile app support
- [ ] Voice input integration

## Support

For issues or questions:

- **Documentation**: [Full docs](../docs/README.md)
- **AI Service README**: [services/ai-service/README.md](../services/ai-service/README.md)
- **GitHub Issues**: [Create an issue](https://github.com/singhed/invoice-flow-saas/issues)
- **Demo Script**: Run `bash examples/ai-invoice-demo.sh` for examples

## License

MIT License - See [LICENSE](../LICENSE) for details.
