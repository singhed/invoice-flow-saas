# Invoice Flow SaaS - Setup Guide

## Quick Start

This guide will help you set up the Invoice Flow SaaS database from scratch.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher
- **npm** (comes with Node.js)
- Basic familiarity with command line

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd invoice-flow-saas

# Install dependencies
npm install
```

### 2. Set Up PostgreSQL

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE invoice_flow_db;

# Create user (optional, if not using existing user)
CREATE USER invoice_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE invoice_flow_db TO invoice_user;

# Exit psql
\q
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

Update the `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://invoice_user:your_secure_password@localhost:5432/invoice_flow_db?schema=public"
```

For production with SSL:
```env
DATABASE_URL="postgresql://user:password@your-host.com:5432/invoice_flow_db?schema=public&sslmode=require"
```

### 4. Run Database Migrations

```bash
# Apply all migrations to create the database schema
npm run db:migrate:deploy
```

This will:
- Create all tables
- Set up relationships and constraints
- Create indexes for performance
- Set up enums

### 5. Generate Prisma Client

```bash
# Generate the Prisma Client for type-safe database access
npm run db:generate
```

### 6. Seed Sample Data (Optional)

For development environments, you can populate the database with sample data:

```bash
# Run the seed script
npm run db:seed
```

This creates:
- 2 sample users
- 3 clients
- 4 projects
- Multiple time entries
- 3 invoices
- Payment records
- Expenses and categories
- Reminders
- Integration configurations

### 7. Verify Installation

```bash
# Open Prisma Studio to view your database
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can browse and edit your database.

## What Was Created?

### Database Schema

The migration created 11 tables:

1. **users** - System users
2. **clients** - Customer/client information
3. **projects** - Projects for clients
4. **time_entries** - Time tracking records
5. **invoices** - Invoice records
6. **invoice_line_items** - Invoice line items
7. **payments** - Payment tracking
8. **expense_categories** - Expense categories
9. **expenses** - Expense records
10. **reminders** - Automated reminders
11. **integrations** - Third-party integrations

### Enums

8 enum types for type safety:
- UserRole
- ClientStatus
- ProjectStatus
- InvoiceStatus
- PaymentMethod
- ReminderType
- IntegrationProvider
- IntegrationStatus

### Indexes

Strategic indexes on:
- All foreign keys
- Status fields
- Date fields
- Unique constraints

## Available Commands

### Database Operations

```bash
# Generate Prisma Client
npm run db:generate

# Create new migration (development)
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:deploy

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Prisma CLI Commands

```bash
# Validate schema
npx prisma validate

# Format schema
npx prisma format

# View migration status
npx prisma migrate status

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Project Structure

```
invoice-flow-saas/
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.js                    # Seed script
│   ├── migrations/                # Migration files
│   │   ├── migration_lock.toml
│   │   └── 20251016172016_initial_schema/
│   │       └── migration.sql
│   ├── ERD.md                     # Entity Relationship Diagram
│   └── README.md                  # Prisma documentation
├── docs/
│   ├── DATABASE.md                # Comprehensive database docs
│   └── schema-diagram.mmd         # Mermaid ERD diagram
├── generated/
│   └── prisma/                    # Generated Prisma Client (gitignored)
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Example environment file
├── .gitignore                     # Git ignore rules
├── package.json                   # Project dependencies
├── README.md                      # Project overview
└── SETUP_GUIDE.md                 # This file
```

## Using Prisma Client

### Import and Initialize

```javascript
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
```

### Example Queries

**Create a new client:**
```javascript
const client = await prisma.client.create({
  data: {
    name: 'New Company',
    email: 'contact@newcompany.com',
    status: 'ACTIVE',
    userId: 'user_id_here'
  }
});
```

**Find active projects:**
```javascript
const projects = await prisma.project.findMany({
  where: {
    status: 'ACTIVE',
    userId: 'user_id_here'
  },
  include: {
    client: true,
    timeEntries: true
  }
});
```

**Create an invoice:**
```javascript
const invoice = await prisma.invoice.create({
  data: {
    invoiceNumber: 'INV-2024-100',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'DRAFT',
    subtotal: 1000.00,
    taxRate: 8.5,
    taxAmount: 85.00,
    total: 1085.00,
    clientId: 'client_id_here',
    userId: 'user_id_here',
    lineItems: {
      create: [
        {
          description: 'Consulting Services',
          quantity: 10,
          unitPrice: 100,
          amount: 1000
        }
      ]
    }
  }
});
```

## Development Workflow

### Making Schema Changes

1. **Edit schema:**
   ```bash
   nano prisma/schema.prisma
   ```

2. **Create migration:**
   ```bash
   npm run db:migrate
   # Enter a descriptive name when prompted
   ```

3. **Review generated SQL:**
   ```bash
   cat prisma/migrations/[timestamp]_[name]/migration.sql
   ```

4. **Regenerate client:**
   ```bash
   npm run db:generate
   ```

5. **Test changes:**
   ```bash
   npm run db:studio
   ```

6. **Commit:**
   ```bash
   git add prisma/
   git commit -m "feat: add new schema changes"
   ```

## Production Deployment

### Initial Deployment

```bash
# 1. Set production DATABASE_URL environment variable
export DATABASE_URL="postgresql://..."

# 2. Run migrations
npm run db:migrate:deploy

# 3. Generate Prisma Client
npm run db:generate

# 4. Start your application
npm start
```

### Deploying Updates

```bash
# 1. Deploy new code
git pull origin main

# 2. Apply new migrations
npm run db:migrate:deploy

# 3. Restart application
pm2 restart app
```

## Troubleshooting

### Issue: Can't connect to database

**Solution:**
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check DATABASE_URL in `.env`
3. Verify database exists: `psql -l`
4. Check user permissions

### Issue: Migration fails

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# If needed, mark migration as applied
npx prisma migrate resolve --applied [migration_name]

# Or reset and re-run (WARNING: deletes all data)
npx prisma migrate reset
```

### Issue: Prisma Client not found

**Solution:**
```bash
# Regenerate Prisma Client
rm -rf generated/prisma
npm run db:generate
```

### Issue: Out of sync migrations

**Solution:**
```bash
# Development: Reset and reapply
npx prisma migrate reset

# Production: Resolve manually
npx prisma migrate status
npx prisma migrate resolve --help
```

## Best Practices

### Schema Design
- ✅ Use descriptive model and field names
- ✅ Add indexes for frequently queried fields
- ✅ Use enums for predefined values
- ✅ Include created/updated timestamps
- ✅ Use appropriate cascade behaviors

### Migrations
- ✅ Name migrations descriptively
- ✅ Review generated SQL before applying
- ✅ Test on staging before production
- ✅ Never edit applied migrations
- ✅ Keep migrations focused and small

### Queries
- ✅ Use `select` to fetch only needed fields
- ✅ Implement pagination for large datasets
- ✅ Use `include` to avoid N+1 queries
- ✅ Use transactions for multi-step operations
- ✅ Handle errors gracefully

### Security
- ✅ Never store plain passwords
- ✅ Encrypt sensitive tokens
- ✅ Use environment variables for credentials
- ✅ Implement row-level security
- ✅ Validate all user inputs
- ✅ Use SSL in production

## Documentation

- **[README.md](README.md)** - Project overview
- **[prisma/ERD.md](prisma/ERD.md)** - Entity Relationship Diagram with Mermaid
- **[prisma/README.md](prisma/README.md)** - Prisma-specific documentation
- **[docs/DATABASE.md](docs/DATABASE.md)** - Comprehensive database documentation
- **[docs/schema-diagram.mmd](docs/schema-diagram.mmd)** - Standalone Mermaid diagram

## Sample Data Overview

If you ran the seed script, you have:

**Users:**
- admin@example.com (ADMIN role)
- john.doe@example.com (USER role)

**Clients:**
- Acme Corporation
- TechStart Inc
- Global Industries

**Projects:**
- Website Redesign (ACTIVE)
- Mobile App Development (ACTIVE)
- API Integration (ACTIVE)
- Security Audit (COMPLETED)

**Invoices:**
- INV-2024-001 (SENT)
- INV-2024-002 (PAID)
- INV-2024-003 (DRAFT)

## Next Steps

1. **Integrate with your application** - Import Prisma Client in your app
2. **Add authentication** - Implement user login/signup
3. **Create API endpoints** - Build REST or GraphQL API
4. **Add business logic** - Implement invoice generation, time tracking
5. **Set up integrations** - Connect with Stripe, QuickBooks, etc.
6. **Deploy to production** - Set up hosting and CI/CD

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)

## Support

For issues:
1. Check this guide and other documentation
2. Review Prisma documentation
3. Use Prisma Studio to inspect database
4. Check migration status
5. Review application logs

## License

ISC
