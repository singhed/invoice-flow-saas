#!/bin/bash

# AI Invoice Generation Demo Script
# This script demonstrates the AI-powered invoice generation feature

set -e

AI_SERVICE_URL="${AI_SERVICE_URL:-http://localhost:3009}"

echo "🤖 AI Invoice Generation Demo"
echo "=============================="
echo ""

# Test 1: Health Check
echo "📊 Test 1: Health Check"
echo "Checking if AI service is running..."
curl -s "${AI_SERVICE_URL}/ai/health" | jq '.'
echo ""

# Test 2: Get Configuration
echo "⚙️  Test 2: Service Configuration"
echo "Getting service configuration..."
curl -s "${AI_SERVICE_URL}/ai/config" | jq '.'
echo ""

# Test 3: Simple Invoice from Text
echo "📝 Test 3: Generate Invoice from Natural Language"
echo "Input: 'Invoice Acme Corp for consulting services...'"
curl -s -X POST "${AI_SERVICE_URL}/ai/generate-invoice" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Invoice Acme Corp (billing@acme.com, 123 Main St, NYC, NY 10001) for 5 hours of consulting services at $150 per hour. Add 8.5% sales tax. Due in 30 days."
  }' | jq '.'
echo ""

# Test 4: Complex Invoice with Multiple Items
echo "💼 Test 4: Generate Complex Invoice"
echo "Input: Multiple line items with different rates..."
curl -s -X POST "${AI_SERVICE_URL}/ai/generate-invoice" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Invoice TechStart Inc for: 1) Website development - 10 hours @ $200/hr, 2) Logo design - 1 unit @ $500, 3) Monthly hosting - 1 month @ $99. Customer email: finance@techstart.com. Address: 456 Tech Blvd, San Francisco, CA 94102. Add 9.5% tax. Payment terms: Net 30. Note: 50% deposit already paid."
  }' | jq '.'
echo ""

# Test 5: International Invoice
echo "🌍 Test 5: Generate International Invoice"
echo "Input: Non-US currency and rates..."
curl -s -X POST "${AI_SERVICE_URL}/ai/generate-invoice" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Invoice Global Ltd for software license - 5 seats @ €299 per seat. Customer: innovation@global.co.uk, London Office, UK. VAT 20%. Payment due in 14 days."
  }' | jq '.'
echo ""

# Test 6: Minimal Information
echo "🔍 Test 6: Minimal Input (AI Inference)"
echo "Input: Very basic information, testing AI inference..."
curl -s -X POST "${AI_SERVICE_URL}/ai/generate-invoice" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Invoice John Smith for web design work, $500 total"
  }' | jq '.'
echo ""

echo "✅ All tests completed!"
echo ""
echo "📚 Next Steps:"
echo "  1. Review generated invoices above"
echo "  2. Check confidence scores (should be 0.7+)"
echo "  3. Try uploading a PDF: curl -X POST ${AI_SERVICE_URL}/ai/generate-invoice -F 'file=@invoice.pdf'"
echo "  4. Visit the web UI: http://localhost:3001/ai-invoice"
echo ""
echo "💡 Tips:"
echo "  - Include customer email and address for better results"
echo "  - Specify exact amounts, quantities, and rates"
echo "  - Mention tax rates and payment terms"
echo "  - The more details, the higher the confidence score!"
