# Prisma Database Setup

This directory contains the Prisma schema, migrations, and seed data for the Invoice Flow SaaS application.

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+

### Environment Setup

1. Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/invoice_flow_db?schema=public"
```

2. Update the connection string with your PostgreSQL credentials.

### Database Commands

```bash
# Generate Prisma Client (run after schema changes)
npm run db:generate

# Create and apply a new migration
npm run db:migrate

# Apply existing migrations (production)
npm run db:migrate:deploy

# Seed the database with sample data
npm run db:seed

# Open Prisma Studio (visual database browser)
npm run db:studio
```

## Project Structure

```
prisma/
├── schema.prisma           # Database schema definition
├── migrations/             # Database migration files
│   ├── migration_lock.toml
│   └── [timestamp]_initial_schema/
│       └── migration.sql
├── seed.js                 # Database seed script
├── ERD.md                  # Entity Relationship Diagram documentation
└── README.md               # This file
```

## Schema Overview

The database schema includes the following core entities:

- **User**: System users with role-based access
- **Client**: Customers who receive invoices
- **Project**: Billable projects for clients
- **TimeEntry**: Time tracking for projects
- **Invoice**: Invoices sent to clients
- **InvoiceLineItem**: Line items on invoices
- **Payment**: Payment records for invoices
- **Expense**: Business expense tracking
- **ExpenseCategory**: Expense categorization
- **Reminder**: Automated invoice reminders
- **Integration**: Third-party service integrations

For detailed schema documentation and ERD, see [ERD.md](./ERD.md).

## Initial Migration

The initial migration (`20251016172016_initial_schema`) creates:

- 11 tables with proper indexes and constraints
- 8 enums for type safety
- Foreign key relationships with cascade rules
- Unique constraints for data integrity

## Seed Data

The seed script creates sample data for development and testing:

- 2 users (admin and regular user)
- 3 clients with complete contact information
- 4 projects in various states
- Multiple time entries
- 3 invoices (draft, sent, paid)
- Invoice line items
- Payment records
- Expense categories and expenses
- Invoice reminders
- Integration configurations

To seed your database:

```bash
npm run db:seed
```

## Development Workflow

### Making Schema Changes

1. Edit `schema.prisma`
2. Create a migration:
   ```bash
   npm run db:migrate
   ```
3. Name your migration descriptively (e.g., "add_user_preferences")
4. Review the generated SQL in `migrations/[timestamp]_[name]/migration.sql`
5. Test the migration on your development database
6. Commit both the schema and migration files

### Generating Prisma Client

The Prisma Client is auto-generated based on your schema. Regenerate it after schema changes:

```bash
npm run db:generate
```

The client is generated to `../generated/prisma` as configured in `schema.prisma`.

## Prisma Studio

Prisma Studio provides a visual interface to view and edit your database:

```bash
npm run db:studio
```

This opens a browser at `http://localhost:5555` with a GUI for your database.

## Production Deployment

### First Deployment

1. Set the `DATABASE_URL` environment variable
2. Run migrations:
   ```bash
   npm run db:migrate:deploy
   ```
3. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```
4. Optionally seed initial data (modify seed script for production):
   ```bash
   npm run db:seed
   ```

### Subsequent Deployments

```bash
# Apply new migrations only
npm run db:migrate:deploy

# Regenerate client if needed
npm run db:generate
```

## Best Practices

### Schema Design

1. Use descriptive field names
2. Add comments for complex relationships
3. Use enums for predefined values
4. Add indexes for frequently queried fields
5. Use appropriate data types (Decimal for money, DateTime for timestamps)

### Migrations

1. Always review generated SQL before applying
2. Never edit migration files after they're committed
3. Test migrations on a copy of production data
4. Keep migrations small and focused
5. Name migrations descriptively

### Queries

1. Use `include` and `select` to fetch only needed data
2. Use transactions for multi-step operations
3. Use `findMany` with proper pagination
4. Add database indexes for slow queries
5. Use Prisma's type safety - avoid raw SQL when possible

## Troubleshooting

### Connection Issues

If you get connection errors:

1. Check PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Ensure database exists: `createdb invoice_flow_db`
4. Check PostgreSQL user permissions

### Migration Issues

If migrations fail:

```bash
# Check migration status
npx prisma migrate status

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Mark specific migration as applied
npx prisma migrate resolve --applied [migration_name]
```

### Client Generation Issues

If Prisma Client has issues:

```bash
# Clear generated client and regenerate
rm -rf generated/prisma
npm run db:generate
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [ERD Documentation](./ERD.md)

## Support

For schema-related questions or issues:

1. Check this README and ERD.md
2. Review Prisma documentation
3. Inspect database with Prisma Studio
4. Check migration history
