import dotenv from 'dotenv';

dotenv.config();

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const trimOrEmpty = (value: string | undefined): string => value?.trim() ?? '';

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: numberFromEnv(process.env.INVOICE_SERVICE_PORT || process.env.PORT, 3002),
  aws: {
    region: trimOrEmpty(process.env.AWS_SES_REGION || process.env.AWS_REGION) || 'us-east-1',
    accessKeyId: trimOrEmpty(process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID),
    secretAccessKey: trimOrEmpty(process.env.AWS_SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY),
    senderEmail: trimOrEmpty(process.env.AWS_SES_FROM_EMAIL),
  },
  shopify: {
    storeDomain: trimOrEmpty(process.env.SHOPIFY_STORE_DOMAIN),
    accessToken: trimOrEmpty(process.env.SHOPIFY_ACCESS_TOKEN),
    apiVersion: trimOrEmpty(process.env.SHOPIFY_API_VERSION) || '2023-10',
  },
  company: {
    legalName: trimOrEmpty(process.env.COMPANY_LEGAL_NAME) || 'Invoice SaaS',
    supportEmail: trimOrEmpty(process.env.COMPANY_SUPPORT_EMAIL) || 'support@example.com',
    postalAddress: trimOrEmpty(process.env.COMPANY_POSTAL_ADDRESS) || '123 Commerce Ave, Toronto, ON, Canada',
  },
  invoice: {
    defaultCurrency: trimOrEmpty(process.env.INVOICE_DEFAULT_CURRENCY) || 'USD',
  },
};

export type AppConfig = typeof config;
