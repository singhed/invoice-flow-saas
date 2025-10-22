import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { logger, AppError } from '@invoice-saas/shared';
import { config } from '../config';
import { InvoiceAttachment } from '../types';

export interface InvoiceEmailPayload {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  attachment: InvoiceAttachment;
}

const encodeSubject = (subject: string): string => `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;

const formatBase64 = (buffer: Buffer): string => buffer.toString('base64').replace(/(.{76})/g, '$1\r\n');

export class AwsSesEmailService {
  private readonly client: SESClient;

  constructor() {
    const credentials = config.aws.accessKeyId && config.aws.secretAccessKey
      ? { accessKeyId: config.aws.accessKeyId, secretAccessKey: config.aws.secretAccessKey }
      : undefined;

    this.client = new SESClient({
      region: config.aws.region,
      credentials,
    });
  }

  async sendInvoiceEmail(payload: InvoiceEmailPayload): Promise<void> {
    if (!config.aws.senderEmail) {
      throw new AppError(500, 'AWS SES sender email address is not configured');
    }

    const boundary = `NextPart${Date.now()}`;
    const rawEmail = this.composeRawEmail(payload, boundary);

    try {
      await this.client.send(new SendRawEmailCommand({ RawMessage: { Data: Buffer.from(rawEmail) } }));
    } catch (error) {
      logger.error('Failed to send invoice email through AWS SES', {
        error: (error as Error).message,
      });
      throw new AppError(502, 'Sending invoice email failed');
    }
  }

  private composeRawEmail(payload: InvoiceEmailPayload, boundary: string): string {
    const from = config.aws.senderEmail;
    const lines: string[] = [
      `From: ${from}`,
      `To: ${payload.to}`,
      `Subject: ${encodeSubject(payload.subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      payload.textBody,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      payload.htmlBody,
      '',
      `--${boundary}`,
      `Content-Type: ${payload.attachment.contentType}; name="${payload.attachment.fileName}"`,
      `Content-Disposition: attachment; filename="${payload.attachment.fileName}"`,
      'Content-Transfer-Encoding: base64',
      '',
      formatBase64(payload.attachment.content),
      '',
      `--${boundary}--`,
      '',
    ];

    return lines.join('\r\n');
  }
}

export const emailService = new AwsSesEmailService();
