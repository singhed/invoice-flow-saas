const parseInteger = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const config = {
  port: parseInteger(process.env.PAYMENT_SERVICE_PORT, 3004),
  defaultCurrency: (process.env.PAYMENT_DEFAULT_CURRENCY || process.env.INVOICE_DEFAULT_CURRENCY || 'USD').toUpperCase(),
  reconciliationHoldHours: parseInteger(process.env.PAYMENT_RECONCILIATION_HOLD_HOURS, 24),
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  maxPageSize: parseInteger(process.env.PAYMENT_MAX_PAGE_SIZE, 100),
};
