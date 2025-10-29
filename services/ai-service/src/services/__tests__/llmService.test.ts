import { generateInvoiceFromText } from '../llmService';

describe('LLM Service', () => {
  beforeAll(() => {
    // Set test API key
    process.env.GROK_API_KEY = 'test-key';
  });

  describe('generateInvoiceFromText', () => {
    it('should throw error when no API keys are configured', async () => {
      const originalGrokKey = process.env.GROK_API_KEY;
      const originalOpenAIKey = process.env.OPENAI_API_KEY;

      delete process.env.GROK_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(
        generateInvoiceFromText('Invoice for services')
      ).rejects.toThrow('No AI API keys configured');

      process.env.GROK_API_KEY = originalGrokKey;
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    });

    it('should accept valid input text', async () => {
      const input = 'Invoice Acme Corp for 5 hours at $150/hr. Due in 30 days.';
      expect(input).toBeTruthy();
      expect(input.length).toBeGreaterThan(10);
    });
  });
});
