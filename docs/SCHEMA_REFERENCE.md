# Schema Quick Reference

## Models Overview

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| User | System users | email, name, role |
| Client | Customers | name, email, status |
| Project | Client projects | name, hourlyRate, status |
| TimeEntry | Time tracking | startTime, endTime, duration |
| Invoice | Invoices | invoiceNumber, status, total |
| InvoiceLineItem | Invoice items | description, quantity, amount |
| Payment | Payments | amount, paymentMethod |
| ExpenseCategory | Expense categories | name |
| Expense | Business expenses | amount, expenseDate |
| Reminder | Automated reminders | reminderDate, reminderType |
| Integration | Third-party integrations | provider, status |

## Relationships

```
User (1) ─── (N) Client
User (1) ─── (N) Project
User (1) ─── (N) TimeEntry
User (1) ─── (N) Invoice
User (1) ─── (N) Expense
User (1) ─── (N) Reminder
User (1) ─── (N) Integration

Client (1) ─── (N) Project
Client (1) ─── (N) Invoice

Project (1) ─── (N) TimeEntry
Project (1) ─── (N) InvoiceLineItem

Invoice (1) ─── (N) InvoiceLineItem
Invoice (1) ─── (N) Payment
Invoice (1) ─── (N) Reminder

InvoiceLineItem (1) ─── (N) TimeEntry

ExpenseCategory (1) ─── (N) Expense
```

## Enums Quick Reference

### UserRole
- `ADMIN` - Full access
- `USER` - Standard user
- `VIEWER` - Read-only

### ClientStatus
- `ACTIVE` - Active client
- `INACTIVE` - Inactive
- `ARCHIVED` - Archived

### ProjectStatus
- `ACTIVE` - In progress
- `ON_HOLD` - Paused
- `COMPLETED` - Done
- `CANCELLED` - Cancelled

### InvoiceStatus
- `DRAFT` - Being prepared
- `SENT` - Sent to client
- `VIEWED` - Client viewed
- `PAID` - Payment received
- `OVERDUE` - Past due
- `CANCELLED` - Cancelled

### PaymentMethod
- `CASH` - Cash
- `CHECK` - Check
- `BANK_TRANSFER` - Bank transfer
- `CREDIT_CARD` - Credit card
- `PAYPAL` - PayPal
- `STRIPE` - Stripe
- `OTHER` - Other

### ReminderType
- `PAYMENT_DUE` - Payment due soon
- `PAYMENT_OVERDUE` - Payment overdue
- `INVOICE_SENT` - Invoice sent
- `CUSTOM` - Custom

### IntegrationProvider
- `STRIPE` - Stripe
- `PAYPAL` - PayPal
- `QUICKBOOKS` - QuickBooks
- `XERO` - Xero
- `GOOGLE_CALENDAR` - Google Calendar
- `SLACK` - Slack
- `ZAPIER` - Zapier

### IntegrationStatus
- `ACTIVE` - Working
- `INACTIVE` - Disabled
- `ERROR` - Has errors

## Common Query Examples

### Prisma Client Usage

```javascript
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
```

### User Operations

```javascript
// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    passwordHash: 'hashed_password',
    role: 'USER'
  }
});

// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});

// Get user with relations
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    clients: true,
    projects: true,
    invoices: true
  }
});
```

### Client Operations

```javascript
// Create client
const client = await prisma.client.create({
  data: {
    name: 'Acme Corp',
    email: 'contact@acme.com',
    status: 'ACTIVE',
    userId: userId
  }
});

// Get active clients
const clients = await prisma.client.findMany({
  where: {
    userId: userId,
    status: 'ACTIVE'
  },
  include: {
    projects: true
  }
});

// Update client
const client = await prisma.client.update({
  where: { id: clientId },
  data: { status: 'INACTIVE' }
});
```

### Project Operations

```javascript
// Create project
const project = await prisma.project.create({
  data: {
    name: 'Website Redesign',
    hourlyRate: 150.00,
    status: 'ACTIVE',
    clientId: clientId,
    userId: userId
  }
});

// Get active projects
const projects = await prisma.project.findMany({
  where: {
    userId: userId,
    status: 'ACTIVE'
  },
  include: {
    client: true,
    timeEntries: {
      where: { invoiced: false }
    }
  }
});

// Complete project
const project = await prisma.project.update({
  where: { id: projectId },
  data: {
    status: 'COMPLETED',
    endDate: new Date()
  }
});
```

### Time Entry Operations

```javascript
// Start timer
const timeEntry = await prisma.timeEntry.create({
  data: {
    description: 'Working on feature X',
    startTime: new Date(),
    isBillable: true,
    projectId: projectId,
    userId: userId
  }
});

// Stop timer
const timeEntry = await prisma.timeEntry.update({
  where: { id: timeEntryId },
  data: {
    endTime: new Date(),
    duration: calculateDuration(startTime, endTime)
  }
});

// Get unbilled time
const unbilledTime = await prisma.timeEntry.findMany({
  where: {
    userId: userId,
    isBillable: true,
    invoiced: false
  },
  include: {
    project: {
      include: { client: true }
    }
  }
});
```

### Invoice Operations

```javascript
// Create invoice
const invoice = await prisma.invoice.create({
  data: {
    invoiceNumber: 'INV-2024-001',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'DRAFT',
    subtotal: 1000.00,
    taxRate: 8.5,
    taxAmount: 85.00,
    total: 1085.00,
    clientId: clientId,
    userId: userId,
    lineItems: {
      create: [
        {
          description: 'Consulting Services',
          quantity: 10,
          unitPrice: 100,
          amount: 1000,
          projectId: projectId
        }
      ]
    }
  }
});

// Get invoice with details
const invoice = await prisma.invoice.findUnique({
  where: { id: invoiceId },
  include: {
    client: true,
    lineItems: {
      include: {
        project: true,
        timeEntries: true
      }
    },
    payments: true
  }
});

// Send invoice
const invoice = await prisma.invoice.update({
  where: { id: invoiceId },
  data: { status: 'SENT' }
});

// Get overdue invoices
const overdueInvoices = await prisma.invoice.findMany({
  where: {
    userId: userId,
    status: { notIn: ['PAID', 'CANCELLED'] },
    dueDate: { lt: new Date() }
  },
  include: { client: true }
});
```

### Payment Operations

```javascript
// Record payment
const payment = await prisma.payment.create({
  data: {
    amount: 1085.00,
    paymentDate: new Date(),
    paymentMethod: 'STRIPE',
    transactionId: 'ch_123456789',
    invoiceId: invoiceId
  }
});

// Mark invoice as paid (with transaction)
const result = await prisma.$transaction(async (tx) => {
  const payment = await tx.payment.create({
    data: {
      amount: 1085.00,
      paymentMethod: 'BANK_TRANSFER',
      invoiceId: invoiceId
    }
  });
  
  const invoice = await tx.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID' }
  });
  
  return { payment, invoice };
});

// Get payment history
const payments = await prisma.payment.findMany({
  where: {
    invoice: { userId: userId }
  },
  include: {
    invoice: {
      include: { client: true }
    }
  },
  orderBy: { paymentDate: 'desc' }
});
```

### Expense Operations

```javascript
// Create expense
const expense = await prisma.expense.create({
  data: {
    description: 'Office supplies',
    amount: 150.00,
    expenseDate: new Date(),
    vendor: 'Office Depot',
    isBillable: false,
    categoryId: categoryId,
    userId: userId
  }
});

// Get expenses by date range
const expenses = await prisma.expense.findMany({
  where: {
    userId: userId,
    expenseDate: {
      gte: startDate,
      lte: endDate
    }
  },
  include: { category: true },
  orderBy: { expenseDate: 'desc' }
});

// Get unbilled expenses
const unbilled = await prisma.expense.findMany({
  where: {
    userId: userId,
    isBillable: true,
    invoiced: false
  }
});
```

### Reminder Operations

```javascript
// Create reminder
const reminder = await prisma.reminder.create({
  data: {
    reminderDate: new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000),
    reminderType: 'PAYMENT_DUE',
    message: 'Payment due in 7 days',
    invoiceId: invoiceId,
    userId: userId
  }
});

// Get pending reminders
const pending = await prisma.reminder.findMany({
  where: {
    sent: false,
    reminderDate: { lte: new Date() }
  },
  include: {
    invoice: {
      include: { client: true }
    }
  }
});

// Mark reminder as sent
const reminder = await prisma.reminder.update({
  where: { id: reminderId },
  data: {
    sent: true,
    sentAt: new Date()
  }
});
```

### Integration Operations

```javascript
// Create integration
const integration = await prisma.integration.create({
  data: {
    provider: 'STRIPE',
    accessToken: 'encrypted_token',
    status: 'ACTIVE',
    config: {
      webhookSecret: 'whsec_123',
      publishableKey: 'pk_test_123'
    },
    userId: userId
  }
});

// Get active integrations
const integrations = await prisma.integration.findMany({
  where: {
    userId: userId,
    status: 'ACTIVE'
  }
});

// Update integration status
const integration = await prisma.integration.update({
  where: { id: integrationId },
  data: { status: 'ERROR' }
});
```

## Aggregation Examples

### Total revenue
```javascript
const revenue = await prisma.invoice.aggregate({
  where: {
    userId: userId,
    status: 'PAID'
  },
  _sum: { total: true }
});
```

### Average hourly rate
```javascript
const avgRate = await prisma.project.aggregate({
  where: { userId: userId },
  _avg: { hourlyRate: true }
});
```

### Count by status
```javascript
const statusCounts = await prisma.invoice.groupBy({
  by: ['status'],
  where: { userId: userId },
  _count: true
});
```

### Total unbilled time
```javascript
const unbilledTime = await prisma.timeEntry.aggregate({
  where: {
    userId: userId,
    isBillable: true,
    invoiced: false
  },
  _sum: { duration: true }
});
```

## Transaction Examples

### Invoice with line items
```javascript
const invoice = await prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-001',
      // ... other invoice fields
    }
  });
  
  await tx.invoiceLineItem.createMany({
    data: lineItems.map(item => ({
      ...item,
      invoiceId: invoice.id
    }))
  });
  
  await tx.timeEntry.updateMany({
    where: { id: { in: timeEntryIds } },
    data: { invoiced: true }
  });
  
  return invoice;
});
```

## Field Constraints

### Required Fields
- All `id` fields
- User: email, name, passwordHash
- Client: name, userId
- Project: name, hourlyRate, clientId, userId
- TimeEntry: description, startTime, projectId, userId
- Invoice: invoiceNumber, dueDate, subtotal, taxAmount, total, clientId, userId
- InvoiceLineItem: description, quantity, unitPrice, amount, invoiceId
- Payment: amount, paymentMethod, invoiceId
- ExpenseCategory: name
- Expense: description, amount, categoryId, userId
- Reminder: reminderDate, reminderType, invoiceId, userId
- Integration: provider, userId

### Unique Fields
- User: email
- Invoice: invoiceNumber
- Integration: (userId + provider) composite

### Default Values
- User.role: 'USER'
- Client.status: 'ACTIVE'
- Project.status: 'ACTIVE'
- TimeEntry.isBillable: true
- TimeEntry.invoiced: false
- Invoice.status: 'DRAFT'
- Invoice.taxRate: 0
- Expense.isBillable: false
- Expense.invoiced: false
- Reminder.sent: false
- Integration.status: 'ACTIVE'
- All createdAt: now()
- All updatedAt: auto-update

## Cascade Behaviors

### ON DELETE CASCADE
- User deletion → deletes all owned entities
- Client deletion → deletes Projects and Invoices
- Project deletion → deletes TimeEntries
- Invoice deletion → deletes LineItems, Payments, Reminders
- ExpenseCategory deletion → deletes Expenses

### ON DELETE SET NULL
- Project deletion → sets projectId to NULL in InvoiceLineItems
- InvoiceLineItem deletion → sets invoiceLineItemId to NULL in TimeEntries

## Index Strategy

**Foreign Keys:** All foreign keys are indexed
**Status Fields:** Client.status, Project.status, Invoice.status
**Dates:** TimeEntry.startTime, Invoice.dueDate, Payment.paymentDate, Expense.expenseDate, Reminder.reminderDate
**Booleans:** TimeEntry.invoiced, Reminder.sent, Expense.invoiced
**Unique:** User.email, Invoice.invoiceNumber, Integration(userId, provider)

## Data Types

- **IDs:** String (CUID)
- **Currency:** Decimal(10,2)
- **Tax Rates:** Decimal(5,2)
- **Quantities:** Decimal(10,2)
- **Duration:** Integer (minutes)
- **Dates:** DateTime (TIMESTAMP(3))
- **Config:** Json (JSONB)

## Tips

1. **Use transactions** for multi-step operations
2. **Include relations** to avoid N+1 queries
3. **Use select** to fetch only needed fields
4. **Paginate** large result sets
5. **Index** frequently queried fields (already done)
6. **Validate** at application level before DB operations
7. **Use enums** for type safety
8. **Handle errors** gracefully

## See Also

- [ERD.md](../prisma/ERD.md) - Full schema documentation
- [DATABASE.md](DATABASE.md) - Comprehensive database guide
- [README.md](../prisma/README.md) - Prisma setup guide
