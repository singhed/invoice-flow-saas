import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.AI_SERVICE_PORT || '3009', 10),
  grokApiKey: process.env.GROK_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  grokApiUrl: process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions',
  openaiApiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
  defaultModel: process.env.AI_MODEL || 'grok-beta',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.7'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024, // Convert MB to bytes
};
