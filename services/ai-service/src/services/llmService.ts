import axios from 'axios';
import { logger } from '@invoice-saas/shared';
import { config } from '../config';
import { LlmResponse } from '../types';
import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  total: z.number(),
});

const customerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: z.string().optional(),
});

const invoiceSchema = z.object({
  number: z.string(),
  date: z.string(),
  dueDate: z.string(),
  currency: z.string(),
  subtotal: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  notes: z.string().optional(),
});

const llmResponseSchema = z.object({
  customer: customerSchema,
  invoice: invoiceSchema,
  lineItems: z.array(lineItemSchema).min(1),
  confidence: z.number().min(0).max(1),
});

const buildPrompt = (input: string): string => {
  return `Extract a COMPLETE, professional invoice from this text/email/PDF. Be precise, infer missing details logically (e.g., today's date, standard 8.5% tax if US, net30 terms).

INPUT: ${input}

OUTPUT **ONLY** valid JSON **NO OTHER TEXT**:
{
  "customer": {
    "name": "Acme Corp",
    "email": "billing@acme.com",
    "address": "123 Main St, NYC, NY 10001"
  },
  "invoice": {
    "number": "INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-001",
    "date": "${new Date().toISOString().split('T')[0]}",
    "dueDate": "${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
    "currency": "USD",
    "subtotal": 850,
    "taxRate": 0.085,
    "taxAmount": 72.25,
    "total": 922.25,
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
      "unitPrice": 100,
      "total": 100
    }
  ],
  "confidence": 0.95
}

Rules:
- MUST return valid JSON only
- confidence: 1.0 = perfect match with all details, 0.5 = heavy inference
- Auto-generate invoice number in format YYYYMM-XXX
- Use today's date if not specified
- Add 30 days for due date if not specified
- Include at least 1 line item
- Calculate totals accurately
- Infer reasonable defaults for missing data`;
};

async function callGrokApi(input: string): Promise<LlmResponse> {
  try {
    const response = await axios.post(
      config.grokApiUrl,
      {
        model: config.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a precise invoice data extraction assistant. Always respond with valid JSON only, no additional text.',
          },
          {
            role: 'user',
            content: buildPrompt(input),
          },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.grokApiKey}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Grok API');
    }

    // Try to extract JSON if there's extra text
    let jsonStr = content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsedData = JSON.parse(jsonStr);
    const validated = llmResponseSchema.parse(parsedData);

    logger.info('Grok API call successful', { confidence: validated.confidence });
    return validated;
  } catch (error: any) {
    logger.error('Grok API call failed', {
      message: error.message,
      response: error.response?.data,
    });
    throw error;
  }
}

async function callOpenAiApi(input: string): Promise<LlmResponse> {
  try {
    const response = await axios.post(
      config.openaiApiUrl,
      {
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a precise invoice data extraction assistant. Always respond with valid JSON only, no additional text.',
          },
          {
            role: 'user',
            content: buildPrompt(input),
          },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }

    const parsedData = JSON.parse(content);
    const validated = llmResponseSchema.parse(parsedData);

    logger.info('OpenAI API call successful', { confidence: validated.confidence });
    return validated;
  } catch (error: any) {
    logger.error('OpenAI API call failed', {
      message: error.message,
      response: error.response?.data,
    });
    throw error;
  }
}

export async function generateInvoiceFromText(input: string): Promise<LlmResponse> {
  // Try Grok first if API key is available
  if (config.grokApiKey) {
    try {
      return await callGrokApi(input);
    } catch (error) {
      logger.warn('Grok API failed, falling back to OpenAI', { error });
    }
  }

  // Fall back to OpenAI
  if (config.openaiApiKey) {
    return await callOpenAiApi(input);
  }

  throw new Error('No AI API keys configured. Please set GROK_API_KEY or OPENAI_API_KEY');
}
