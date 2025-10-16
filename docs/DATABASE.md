# Database Documentation

## Overview

This document provides comprehensive documentation for the Invoice Flow SaaS database schema. The database is designed to support a complete time tracking and invoicing system with client management, project tracking, expense management, and third-party integrations.

## Technology Stack

- **Database**: PostgreSQL 14+
- **ORM**: Prisma 6.x
- **Schema Language**: Prisma Schema Language
- **Migration Tool**: Prisma Migrate

## Database Design Principles

1. **Normalization**: The schema follows third normal form (3NF) to minimize data redundancy
2. **Referential Integrity**: Foreign key constraints with appropriate cascade behaviors
3. **Type Safety**: Extensive use of enums for predefined values
4. **Auditability**: All tables include `createdAt` and `updatedAt` timestamps
5. **Scalability**: Strategic indexing for common query patterns
6. **Flexibility**: JSON fields for provider-specific configurations

## Core Data Models

### User Model

The User model represents system users who can create and manage invoices, clients, projects, and track time.

**Fields:**
- `id` (String, PK): Unique CUID identifier
- `email` (String, Unique): User's email address for authentication
- `name` (String): User's display name
- `passwordHash` (String): Bcrypt-hashed password
- `role` (Enum): User role - ADMIN, USER, or VIEWER
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- One-to-many with: Clients, Projects, TimeEntries, Invoices, Expenses, Reminders, Integrations

**Business Rules:**
- Email must be unique across all users
- Password should never be stored in plain text
- ADMIN role has full system access
- USER role can manage their own resources
- VIEWER role has read-only access

### Client Model

Represents customers who receive invoices and have projects.

**Fields:**
- `id` (String, PK): Unique identifier
- `name` (String): Client/company name
- `email` (String, Optional): Client contact email
- `phone` (String, Optional): Client phone number
- `address`, `city`, `state`, `zipCode`, `country` (String, Optional): Physical address
- `taxId` (String, Optional): Tax identification number
- `notes` (Text, Optional): Additional notes about the client
- `status` (Enum): ACTIVE, INACTIVE, or ARCHIVED
- `userId` (String, FK): Owner user reference

**Indexes:**
- `userId` - for fetching user's clients
- `status` - for filtering by status

**Business Rules:**
- Each client must have an owner (user)
- Deleting a user cascades to delete their clients
- Archived clients are soft-deleted (status change, not deletion)

### Project Model

Represents billable projects associated with clients.

**Fields:**
- `id` (String, PK): Unique identifier
- `name` (String): Project name
- `description` (Text, Optional): Project description
- `hourlyRate` (Decimal 10,2): Billing rate per hour
- `status` (Enum): ACTIVE, ON_HOLD, COMPLETED, or CANCELLED
- `startDate` (DateTime, Optional): Project start date
- `endDate` (DateTime, Optional): Project completion date
- `clientId` (String, FK): Associated client
- `userId` (String, FK): Project owner

**Indexes:**
- `clientId` - for fetching client's projects
- `userId` - for fetching user's projects
- `status` - for filtering by status

**Business Rules:**
- Each project must belong to a client
- Hourly rate must be positive
- COMPLETED projects should have an endDate
- Time entries can only be added to ACTIVE projects (enforced at app level)

### TimeEntry Model

Tracks time spent on projects for billing purposes.

**Fields:**
- `id` (String, PK): Unique identifier
- `description` (String): What work was performed
- `startTime` (DateTime): When work started
- `endTime` (DateTime, Optional): When work ended (null for ongoing)
- `duration` (Integer, Optional): Duration in minutes
- `isBillable` (Boolean): Whether this time should be billed
- `invoiced` (Boolean): Whether this has been invoiced
- `projectId` (String, FK): Associated project
- `userId` (String, FK): User who performed the work
- `invoiceLineItemId` (String, FK, Optional): Associated invoice line item

**Indexes:**
- `projectId` - for fetching project's time entries
- `userId` - for fetching user's time entries
- `invoiced` - for finding unbilled time
- `startTime` - for time-based queries

**Business Rules:**
- Duration is calculated from startTime and endTime
- Only billable time should appear on invoices
- Once invoiced, time entries shouldn't be modified
- Running timers have null endTime

### Invoice Model

Represents invoices sent to clients.

**Fields:**
- `id` (String, PK): Unique identifier
- `invoiceNumber` (String, Unique): Human-readable invoice number
- `issueDate` (DateTime): When invoice was created
- `dueDate` (DateTime): Payment due date
- `status` (Enum): DRAFT, SENT, VIEWED, PAID, OVERDUE, or CANCELLED
- `subtotal` (Decimal 10,2): Sum of line items
- `taxRate` (Decimal 5,2): Tax percentage (e.g., 8.5 for 8.5%)
- `taxAmount` (Decimal 10,2): Calculated tax amount
- `total` (Decimal 10,2): Subtotal + tax
- `notes` (Text, Optional): Invoice notes
- `terms` (Text, Optional): Payment terms
- `clientId` (String, FK): Invoice recipient
- `userId` (String, FK): Invoice creator

**Indexes:**
- `invoiceNumber` - unique constraint for lookups
- `clientId` - for fetching client's invoices
- `userId` - for fetching user's invoices
- `status` - for filtering by status
- `dueDate` - for finding overdue invoices

**Business Rules:**
- Invoice numbers should be sequential or follow a pattern
- DRAFT invoices can be modified
- SENT/VIEWED invoices should not be modified
- Total = Subtotal + TaxAmount
- TaxAmount = Subtotal * (TaxRate / 100)
- Status automatically updates to OVERDUE after dueDate

### InvoiceLineItem Model

Individual line items on invoices.

**Fields:**
- `id` (String, PK): Unique identifier
- `description` (String): Line item description
- `quantity` (Decimal 10,2): Number of units
- `unitPrice` (Decimal 10,2): Price per unit
- `amount` (Decimal 10,2): Total for this line (quantity × unitPrice)
- `invoiceId` (String, FK): Parent invoice
- `projectId` (String, FK, Optional): Related project

**Indexes:**
- `invoiceId` - for fetching invoice's line items
- `projectId` - for tracking project billing

**Business Rules:**
- Amount must equal quantity × unitPrice
- Deleting an invoice cascades to delete line items
- Can aggregate multiple time entries into one line item

### Payment Model

Tracks payments received for invoices.

**Fields:**
- `id` (String, PK): Unique identifier
- `amount` (Decimal 10,2): Payment amount
- `paymentDate` (DateTime): When payment was received
- `paymentMethod` (Enum): CASH, CHECK, BANK_TRANSFER, CREDIT_CARD, PAYPAL, STRIPE, OTHER
- `transactionId` (String, Optional): External transaction reference
- `notes` (Text, Optional): Payment notes
- `invoiceId` (String, FK): Associated invoice

**Indexes:**
- `invoiceId` - for fetching invoice's payments
- `paymentDate` - for payment history queries

**Business Rules:**
- Multiple payments can be applied to one invoice
- Sum of payments should not exceed invoice total
- Invoice status updates to PAID when fully paid

### ExpenseCategory Model

Categories for organizing expenses.

**Fields:**
- `id` (String, PK): Unique identifier
- `name` (String): Category name
- `description` (Text, Optional): Category description

**Business Rules:**
- System should provide default categories
- Categories can be customized per user (future enhancement)

### Expense Model

Tracks business expenses.

**Fields:**
- `id` (String, PK): Unique identifier
- `description` (String): Expense description
- `amount` (Decimal 10,2): Expense amount
- `expenseDate` (DateTime): When expense occurred
- `vendor` (String, Optional): Who was paid
- `receipt` (String, Optional): URL or file path to receipt
- `isBillable` (Boolean): Can this be billed to a client
- `invoiced` (Boolean): Has this been invoiced
- `notes` (Text, Optional): Additional notes
- `categoryId` (String, FK): Expense category
- `userId` (String, FK): User who incurred the expense

**Indexes:**
- `categoryId` - for filtering by category
- `userId` - for fetching user's expenses
- `expenseDate` - for date range queries
- `invoiced` - for finding unbilled expenses

**Business Rules:**
- Billable expenses can be added to client invoices
- Receipt storage should be handled by file storage service
- Amount must be positive

### Reminder Model

Automated reminders for invoice-related events.

**Fields:**
- `id` (String, PK): Unique identifier
- `reminderDate` (DateTime): When to send the reminder
- `reminderType` (Enum): PAYMENT_DUE, PAYMENT_OVERDUE, INVOICE_SENT, or CUSTOM
- `message` (Text, Optional): Custom reminder message
- `sent` (Boolean): Whether reminder has been sent
- `sentAt` (DateTime, Optional): When reminder was sent
- `invoiceId` (String, FK): Associated invoice
- `userId` (String, FK): User to remind

**Indexes:**
- `invoiceId` - for fetching invoice's reminders
- `userId` - for fetching user's reminders
- `reminderDate` - for finding due reminders
- `sent` - for filtering unsent reminders

**Business Rules:**
- Reminders should be processed by a scheduled job
- Once sent, reminders should not be re-sent
- Multiple reminders can be set for one invoice

### Integration Model

Third-party service integrations.

**Fields:**
- `id` (String, PK): Unique identifier
- `provider` (Enum): STRIPE, PAYPAL, QUICKBOOKS, XERO, GOOGLE_CALENDAR, SLACK, ZAPIER
- `providerAccountId` (String, Optional): External account ID
- `accessToken` (String, Optional): OAuth access token
- `refreshToken` (String, Optional): OAuth refresh token
- `tokenExpiresAt` (DateTime, Optional): Token expiration time
- `config` (JSON, Optional): Provider-specific configuration
- `status` (Enum): ACTIVE, INACTIVE, or ERROR
- `userId` (String, FK): Integration owner

**Indexes:**
- Unique constraint on (userId, provider) - one integration per provider per user
- `userId` - for fetching user's integrations
- `provider` - for filtering by provider

**Business Rules:**
- Tokens should be encrypted at rest
- Expired tokens should be refreshed automatically
- Failed integrations should update status to ERROR

## Enumeration Types

### UserRole
- `ADMIN`: Full system access, can manage all users and data
- `USER`: Standard access, can manage own resources
- `VIEWER`: Read-only access, cannot create or modify

### ClientStatus
- `ACTIVE`: Currently active client
- `INACTIVE`: Temporarily inactive (not deleted)
- `ARCHIVED`: Archived client (soft delete)

### ProjectStatus
- `ACTIVE`: Currently active project
- `ON_HOLD`: Temporarily paused
- `COMPLETED`: Successfully completed
- `CANCELLED`: Cancelled before completion

### InvoiceStatus
- `DRAFT`: Being prepared, not yet sent
- `SENT`: Sent to client
- `VIEWED`: Client has viewed the invoice
- `PAID`: Payment received in full
- `OVERDUE`: Past due date without payment
- `CANCELLED`: Cancelled invoice

### PaymentMethod
- `CASH`: Cash payment
- `CHECK`: Check/cheque payment
- `BANK_TRANSFER`: Bank transfer/ACH
- `CREDIT_CARD`: Credit card payment
- `PAYPAL`: PayPal payment
- `STRIPE`: Stripe payment
- `OTHER`: Other payment method

### ReminderType
- `PAYMENT_DUE`: Payment due soon notification
- `PAYMENT_OVERDUE`: Payment overdue notification
- `INVOICE_SENT`: Invoice sent confirmation
- `CUSTOM`: Custom reminder

### IntegrationProvider
- `STRIPE`: Stripe payment processing
- `PAYPAL`: PayPal payment processing
- `QUICKBOOKS`: QuickBooks accounting integration
- `XERO`: Xero accounting integration
- `GOOGLE_CALENDAR`: Google Calendar integration
- `SLACK`: Slack notifications
- `ZAPIER`: Zapier automation

### IntegrationStatus
- `ACTIVE`: Integration is active and working
- `INACTIVE`: Integration is disabled
- `ERROR`: Integration has errors

## Database Relationships

### Cascade Behaviors

**ON DELETE CASCADE:**
- User → Clients, Projects, TimeEntries, Invoices, Expenses, Reminders, Integrations
- Client → Projects, Invoices
- Project → TimeEntries
- Invoice → InvoiceLineItems, Payments, Reminders
- ExpenseCategory → Expenses

**ON DELETE SET NULL:**
- Project → InvoiceLineItems (projectId becomes null)
- InvoiceLineItem → TimeEntries (invoiceLineItemId becomes null)

**Rationale:**
- Cascade deletes maintain referential integrity
- SET NULL preserves historical data when references are removed
- Prevents orphaned records in the database

## Indexing Strategy

### Primary Indexes
All tables have a primary key on the `id` field (CUID).

### Foreign Key Indexes
All foreign keys are indexed for join performance:
- `userId` on all user-owned tables
- `clientId` on projects and invoices
- `projectId` on time entries and line items
- `invoiceId` on line items, payments, and reminders
- `categoryId` on expenses

### Query Optimization Indexes
- `users.email` - unique index for authentication
- `clients.status` - for filtering active/inactive clients
- `projects.status` - for filtering by project status
- `time_entries.invoiced` - for finding unbilled time
- `time_entries.startTime` - for time-based queries
- `invoices.invoiceNumber` - unique index for lookups
- `invoices.status` - for invoice status filtering
- `invoices.dueDate` - for overdue invoice detection
- `payments.paymentDate` - for payment history
- `expenses.expenseDate` - for expense reports
- `expenses.invoiced` - for unbilled expenses
- `reminders.reminderDate` - for reminder scheduling
- `reminders.sent` - for unsent reminder queries
- `integrations(userId, provider)` - unique composite index

## Data Types and Precision

### String Fields
- IDs: CUID (26 characters, collision-resistant)
- Text: Variable length
- Email: Validated at application layer

### Numeric Fields
- Currency (Decimal 10,2): Up to 99,999,999.99
- Tax rates (Decimal 5,2): Up to 999.99%
- Quantities (Decimal 10,2): Supports fractional quantities
- Duration (Integer): Minutes

### Temporal Fields
- TIMESTAMP(3): Millisecond precision
- Automatic timezone handling (store in UTC, convert on display)

### JSON Fields
- Integration.config: Flexible provider-specific data
- PostgreSQL JSONB for efficient querying

## Query Patterns

### Common Queries

**Get user's active projects:**
```sql
SELECT * FROM projects 
WHERE userId = ? AND status = 'ACTIVE'
ORDER BY createdAt DESC;
```

**Find unbilled time entries:**
```sql
SELECT * FROM time_entries 
WHERE userId = ? 
  AND isBillable = true 
  AND invoiced = false
ORDER BY startTime DESC;
```

**Get overdue invoices:**
```sql
SELECT * FROM invoices 
WHERE status != 'PAID' 
  AND status != 'CANCELLED'
  AND dueDate < NOW()
ORDER BY dueDate ASC;
```

**Calculate total payments for invoice:**
```sql
SELECT SUM(amount) as totalPaid
FROM payments
WHERE invoiceId = ?;
```

**Get pending reminders:**
```sql
SELECT * FROM reminders
WHERE sent = false
  AND reminderDate <= NOW()
ORDER BY reminderDate ASC;
```

## Performance Considerations

1. **Use SELECT with specific columns** instead of SELECT *
2. **Implement pagination** for large result sets
3. **Use indexes** - already configured for common patterns
4. **Avoid N+1 queries** - use Prisma's `include` for relations
5. **Use connection pooling** in production
6. **Regular VACUUM** operations for PostgreSQL maintenance
7. **Monitor slow queries** and add indexes as needed

## Security Best Practices

1. **Never store plain passwords** - use bcrypt or similar
2. **Encrypt tokens** - integration tokens should be encrypted at rest
3. **Use parameterized queries** - Prisma handles this automatically
4. **Implement row-level security** - ensure users can only access their data
5. **Audit logging** - track sensitive operations
6. **Regular backups** - automate database backups
7. **SSL connections** - use SSL in production
8. **Principle of least privilege** - database user permissions

## Maintenance Tasks

### Daily
- Monitor slow queries
- Check disk space
- Review error logs

### Weekly
- Analyze query performance
- Review growth trends
- Check backup integrity

### Monthly
- Update statistics (ANALYZE)
- Vacuum database
- Review and optimize indexes
- Security audit

## Migration Strategy

### Development
```bash
# Make schema changes
npm run db:migrate
```

### Staging
```bash
# Test migrations
npm run db:migrate:deploy
```

### Production
```bash
# Apply migrations with zero downtime
npm run db:migrate:deploy
```

## Backup and Recovery

### Backup Strategy
1. **Daily full backups** to remote storage
2. **Point-in-time recovery** enabled
3. **Backup retention**: 30 days
4. **Test restores** monthly

### Backup Command
```bash
pg_dump -U user -d invoice_flow_db > backup_$(date +%Y%m%d).sql
```

### Restore Command
```bash
psql -U user -d invoice_flow_db < backup_20240101.sql
```

## Monitoring

### Key Metrics
- Query response times
- Connection pool utilization
- Database size growth
- Index hit ratio
- Cache hit ratio
- Lock contention

### Alerting
- Slow queries (>1 second)
- High connection count
- Disk space <20%
- Failed backup jobs
- Replication lag (if applicable)

## Future Enhancements

1. **Multi-tenancy**: Add organization/tenant isolation
2. **Audit Trail**: Comprehensive change tracking
3. **Soft Deletes**: Add deletedAt for important entities
4. **Versioning**: Track entity version history
5. **Search**: Full-text search on descriptions
6. **Analytics**: Materialized views for reporting
7. **Archiving**: Move old data to archive tables
8. **Sharding**: Horizontal scaling strategy

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Schema ERD](../prisma/ERD.md)
- [Prisma README](../prisma/README.md)
