import { v4 as uuidv4 } from 'uuid';
import { logger, NotFoundError, ValidationError } from '@invoice-saas/shared';
import { config } from '../config';

export const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface PaymentTimelineEntry {
  id: string;
  status: PaymentStatus;
  note?: string;
  changedAt: string;
  metadataSnapshot?: Record<string, any>;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  timeline: PaymentTimelineEntry[];
}

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  currency?: string;
  method: string;
  metadata?: Record<string, any>;
}

export interface PaymentListFilters {
  invoiceId?: string;
  status?: PaymentStatus;
  limit?: number;
  offset?: number;
}

const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['processing', 'failed', 'completed'],
  processing: ['completed', 'failed', 'refunded'],
  completed: ['refunded'],
  failed: ['processing'],
  refunded: [],
};

const clampCurrency = (value: string): string => value.trim().toUpperCase();

const roundToCents = (amount: number): number => Math.round(amount * 100) / 100;

const nowIso = () => new Date().toISOString();

export class PaymentService {
  private payments = new Map<string, PaymentRecord>();

  constructor() {
    this.seedDemoPayments();
  }

  createPayment(input: CreatePaymentInput): PaymentRecord {
    const createdAt = nowIso();
    const id = uuidv4();

    const payment: PaymentRecord = {
      id,
      invoiceId: input.invoiceId,
      amount: roundToCents(input.amount),
      currency: clampCurrency(input.currency || config.defaultCurrency),
      method: input.method,
      status: 'pending',
      metadata: { ...(input.metadata || {}) },
      createdAt,
      updatedAt: createdAt,
      timeline: [this.createTimelineEntry('pending', 'Payment created', input.metadata)],
    };

    this.payments.set(id, payment);

    logger.info('Payment created', {
      paymentId: id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
    });

    return this.clone(payment);
  }

  getPayment(paymentId: string): PaymentRecord {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found`);
    }
    return this.clone(payment);
  }

  listPayments(filters: PaymentListFilters = {}): {
    data: PaymentRecord[];
    pagination: { total: number; count: number; limit: number; offset: number; hasMore: boolean };
  } {
    const limit = Math.min(filters.limit ?? 20, config.maxPageSize);
    const offset = filters.offset ?? 0;

    let data = Array.from(this.payments.values());

    if (filters.invoiceId) {
      data = data.filter((payment) => payment.invoiceId === filters.invoiceId);
    }

    if (filters.status) {
      data = data.filter((payment) => payment.status === filters.status);
    }

    data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = data.length;
    const paginated = data.slice(offset, offset + limit);

    return {
      data: paginated.map((payment) => this.clone(payment)),
      pagination: {
        total,
        count: paginated.length,
        limit,
        offset,
        hasMore: offset + paginated.length < total,
      },
    };
  }

  updatePaymentStatus(paymentId: string, status: PaymentStatus, note?: string, metadataPatch?: Record<string, any>): PaymentRecord {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found`);
    }

    if (payment.status === status) {
      if (metadataPatch && Object.keys(metadataPatch).length > 0) {
        payment.metadata = {
          ...payment.metadata,
          ...metadataPatch,
        };
      }
      payment.timeline.push(this.createTimelineEntry(status, note || 'Status reaffirmed', payment.metadata));
      payment.updatedAt = nowIso();
      return this.clone(payment);
    }

    this.assertTransition(payment.status, status);

    payment.status = status;
    payment.updatedAt = nowIso();

    if (metadataPatch && Object.keys(metadataPatch).length > 0) {
      payment.metadata = {
        ...payment.metadata,
        ...metadataPatch,
      };
    }

    payment.timeline.push(this.createTimelineEntry(status, note, payment.metadata));

    logger.info('Payment status updated', {
      paymentId,
      invoiceId: payment.invoiceId,
      status,
      note,
    });

    return this.clone(payment);
  }

  updatePaymentMetadata(paymentId: string, metadataPatch: Record<string, any>): PaymentRecord {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found`);
    }

    payment.metadata = {
      ...payment.metadata,
      ...metadataPatch,
    };
    payment.updatedAt = nowIso();
    payment.timeline.push(
      this.createTimelineEntry(payment.status, 'Metadata updated', payment.metadata)
    );

    logger.info('Payment metadata updated', {
      paymentId,
      invoiceId: payment.invoiceId,
      keys: Object.keys(metadataPatch),
    });

    return this.clone(payment);
  }

  getTimeline(paymentId: string): PaymentTimelineEntry[] {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found`);
    }
    return payment.timeline.map((entry) => ({
      ...entry,
      metadataSnapshot: entry.metadataSnapshot ? { ...entry.metadataSnapshot } : undefined,
    }));
  }

  private assertTransition(current: PaymentStatus, next: PaymentStatus) {
    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new ValidationError(`Cannot transition payment from ${current} to ${next}`);
    }
  }

  private createTimelineEntry(status: PaymentStatus, note?: string, metadata?: Record<string, any>): PaymentTimelineEntry {
    return {
      id: uuidv4(),
      status,
      note,
      changedAt: nowIso(),
      metadataSnapshot: metadata ? { ...metadata } : undefined,
    };
  }

  private clone(payment: PaymentRecord): PaymentRecord {
    return {
      ...payment,
      metadata: { ...payment.metadata },
      timeline: payment.timeline.map((entry) => ({
        ...entry,
        metadataSnapshot: entry.metadataSnapshot ? { ...entry.metadataSnapshot } : undefined,
      })),
    };
  }

  private seedDemoPayments() {
    const demoPayments: Array<CreatePaymentInput & { status?: PaymentStatus; note?: string }> = [
      {
        invoiceId: 'INV-1001',
        amount: 850.75,
        currency: 'USD',
        method: 'card',
        metadata: { gateway: 'stripe', reference: 'pi_demo_1001' },
        status: 'completed',
        note: 'Payment captured via Stripe',
      },
      {
        invoiceId: 'INV-1002',
        amount: 1200.0,
        currency: 'USD',
        method: 'bank_transfer',
        metadata: { bank: 'Chase Business', reference: 'BTX-88421' },
        status: 'processing',
        note: 'Awaiting bank settlement',
      },
      {
        invoiceId: 'INV-1003',
        amount: 450.5,
        currency: 'EUR',
        method: 'card',
        metadata: { gateway: 'adyen', reference: 'adyen_7781' },
        status: 'failed',
        note: 'Card declined - insufficient funds',
      },
    ];

    for (const { status, note, ...record } of demoPayments) {
      const created = this.createPayment(record);
      if (status && status !== 'pending') {
        try {
          this.updatePaymentStatus(created.id, status, note, record.metadata);
        } catch (err) {
          logger.warn('Failed to seed payment status transition', {
            paymentId: created.id,
            targetStatus: status,
            error: (err as Error).message,
          });
        }
      }
    }
  }
}

export const paymentService = new PaymentService();
