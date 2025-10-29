import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import { logger } from '@invoice-saas/shared';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    logger.info('PDF text extraction successful', { 
      pages: data.numpages,
      textLength: data.text.length 
    });
    return data.text;
  } catch (error: any) {
    logger.error('PDF text extraction failed', { message: error.message });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');
  
  try {
    logger.info('Starting OCR on image');
    const { data } = await worker.recognize(buffer);
    
    logger.info('OCR extraction successful', { 
      confidence: data.confidence,
      textLength: data.text.length 
    });
    
    await worker.terminate();
    return data.text;
  } catch (error: any) {
    logger.error('OCR extraction failed', { message: error.message });
    await worker.terminate();
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPdf(buffer);
  } else if (mimeType.startsWith('image/')) {
    return extractTextFromImage(buffer);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
