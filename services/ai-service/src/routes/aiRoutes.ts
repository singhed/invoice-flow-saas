import express from 'express';
import multer from 'multer';
import Joi from 'joi';
import { logger, ValidationError, AppError } from '@invoice-saas/shared';
import { generateInvoiceFromText } from '../services/llmService';
import { extractTextFromFile } from '../services/ocrService';
import { AiInvoiceRequest, AiInvoiceResponse } from '../types';
import { config } from '../config';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'text/plain',
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const textInvoiceSchema = Joi.object({
  input: Joi.string().required().min(10).max(10000),
  customerId: Joi.string().optional(),
});

router.post('/generate-invoice', upload.single('file'), async (req, res, next) => {
  try {
    let extractedText: string;
    let fileType: 'text' | 'pdf' | 'image' = 'text';

    if (req.file) {
      // File upload scenario
      logger.info('Processing uploaded file', {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      extractedText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
      
      if (req.file.mimetype === 'application/pdf') {
        fileType = 'pdf';
      } else if (req.file.mimetype.startsWith('image/')) {
        fileType = 'image';
      }

      if (!extractedText || extractedText.trim().length < 10) {
        throw new ValidationError('Could not extract sufficient text from the uploaded file');
      }

      logger.info('Text extracted from file', { 
        textLength: extractedText.length,
        fileType,
      });
    } else {
      // Text input scenario
      const { error, value } = textInvoiceSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        throw new ValidationError(error.details.map((detail) => detail.message).join(', '));
      }

      extractedText = value.input;
    }

    // Generate invoice using LLM
    logger.info('Generating invoice with AI', { 
      inputLength: extractedText.length,
      fileType,
    });

    const llmResponse = await generateInvoiceFromText(extractedText);

    // Check confidence threshold
    if (llmResponse.confidence < config.confidenceThreshold) {
      logger.warn('Low confidence AI extraction', {
        confidence: llmResponse.confidence,
        threshold: config.confidenceThreshold,
      });
    }

    const response: AiInvoiceResponse = {
      customer: llmResponse.customer,
      invoice: llmResponse.invoice,
      lineItems: llmResponse.lineItems,
      confidence: llmResponse.confidence,
      rawExtraction: extractedText.substring(0, 500), // Include first 500 chars for reference
    };

    logger.info('AI invoice generation successful', {
      confidence: response.confidence,
      lineItemCount: response.lineItems.length,
      total: response.invoice.total,
    });

    res.status(200).json({
      status: 'success',
      data: response,
    });
  } catch (error: any) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new ValidationError(`File too large. Maximum size: ${config.maxFileSize / 1024 / 1024}MB`));
      }
      return next(new ValidationError(`File upload error: ${error.message}`));
    }
    next(error);
  }
});

router.get('/health', (_req, res) => {
  const hasApiKey = !!(config.grokApiKey || config.openaiApiKey);
  
  res.status(200).json({
    status: 'healthy',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
    aiConfigured: hasApiKey,
  });
});

router.get('/config', (_req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      maxFileSize: config.maxFileSize,
      confidenceThreshold: config.confidenceThreshold,
      supportedFormats: ['text/plain', 'application/pdf', 'image/jpeg', 'image/png', 'image/tiff'],
      aiProvider: config.grokApiKey ? 'grok' : config.openaiApiKey ? 'openai' : 'none',
    },
  });
});

export default router;
