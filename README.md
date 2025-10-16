# Invoice Flow SaaS

A comprehensive time tracking and invoicing system built with Prisma and PostgreSQL.

## Features

- **User Management**: Role-based access control (Admin, User, Viewer)
- **Client Management**: Complete client profiles with contact information
- **Project Tracking**: Manage projects with hourly rates and status tracking
- **Time Tracking**: Track time entries for billable projects
- **Invoicing**: Create, send, and manage invoices with line items
- **Payment Tracking**: Record and track payments against invoices
- **Expense Management**: Track business expenses with categories
- **Automated Reminders**: Schedule and send invoice reminders
- **Integrations**: Connect with Stripe, PayPal, QuickBooks, Xero, and more

## Tech Stack

- **Database**: PostgreSQL
- **ORM**: Prisma
- **Node.js**: 18+

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd invoice-flow-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the `DATABASE_URL` with your PostgreSQL credentials.

4. Create the database:
   ```bash
   createdb invoice_flow_db
   ```

5. Run database migrations:
   ```bash
   npm run db:migrate:deploy
   ```

6. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

7. Seed the database (optional, for development):
   ```bash
   npm run db:seed
   ```

## Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply migrations (development)
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:deploy

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Database Schema

The application uses a comprehensive relational database schema with the following core entities:

### Core Models

- **User**: System users with authentication and role-based access
- **Client**: Customer/client management with full contact information
- **Project**: Project tracking with hourly rates and status
- **TimeEntry**: Time tracking for billable work
- **Invoice**: Invoice generation and management
- **InvoiceLineItem**: Individual line items on invoices
- **Payment**: Payment tracking and reconciliation
- **Expense**: Business expense tracking
- **ExpenseCategory**: Expense categorization
- **Reminder**: Automated reminder system
- **Integration**: Third-party service integrations

### Key Features

- **CUID-based IDs**: Collision-resistant unique identifiers
- **Proper indexing**: Optimized for common query patterns
- **Cascade deletes**: Maintains referential integrity
- **Enum types**: Type-safe status and category fields
- **Decimal precision**: Accurate financial calculations
- **Timestamp tracking**: Automatic created/updated timestamps

For detailed schema documentation and Entity Relationship Diagram, see [prisma/ERD.md](prisma/ERD.md).

## Project Structure

```
├── prisma/
│   ├── schema.prisma           # Prisma schema definition
│   ├── migrations/             # Database migrations
│   ├── seed.js                 # Sample data seed script
│   ├── ERD.md                  # Entity Relationship Diagram
│   └── README.md               # Database documentation
├── generated/
│   └── prisma/                 # Generated Prisma Client (gitignored)
├── .env                        # Environment variables (gitignored)
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies and scripts
└── README.md                   # This file
```

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/invoice_flow_db?schema=public"
```

## Sample Data

The seed script creates comprehensive sample data including:

- 2 users (Admin and regular user)
- 3 clients with full details
- 4 projects in various states
- Multiple time entries
- 3 invoices (draft, sent, paid)
- Payment records
- Expense categories and expenses
- Invoice reminders
- Integration configurations

Run `npm run db:seed` to populate your database with this sample data.

## Development

### Database Migrations

When making schema changes:

1. Edit `prisma/schema.prisma`
2. Create migration: `npm run db:migrate`
3. Name your migration descriptively
4. Review generated SQL
5. Commit schema and migration files

### Prisma Studio

Prisma Studio provides a visual interface for your database:

```bash
npm run db:studio
```

Access at `http://localhost:5555`

## Production Deployment

### Initial Setup

1. Set production `DATABASE_URL` environment variable
2. Apply migrations: `npm run db:migrate:deploy`
3. Generate client: `npm run db:generate`

### Updates

1. Deploy new code
2. Run migrations: `npm run db:migrate:deploy`
3. Restart application

## API Integration

The Prisma Client is generated to `generated/prisma` and can be imported in your application:

```javascript
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

// Example: Fetch all active clients
const clients = await prisma.client.findMany({
  where: { status: 'ACTIVE' },
  include: { projects: true }
});
```

## Documentation

- [Database Schema & ERD](prisma/ERD.md) - Comprehensive schema documentation
- [Prisma Documentation](prisma/README.md) - Database setup and usage
- [Prisma Official Docs](https://www.prisma.io/docs/) - Prisma framework documentation

## Best Practices

1. **Always use transactions** for operations affecting multiple tables
2. **Validate input** at the application level before database operations
3. **Use TypeScript** for type-safe database operations
4. **Index optimization** - indexes are pre-configured for common queries
5. **Migration discipline** - never edit applied migrations
6. **Environment separation** - use different databases for dev/staging/prod
7. **Backup regularly** - implement automated backup strategy

## Security Considerations

- Store password hashes only (never plain passwords)
- Encrypt sensitive integration tokens
- Implement row-level security in application logic
- Validate and sanitize all user inputs
- Use prepared statements (Prisma handles this automatically)
- Enable PostgreSQL SSL in production
- Implement rate limiting for authentication endpoints
- Regular security audits of dependencies

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U user -d invoice_flow_db

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Migration Issues

```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Client Generation Issues

```bash
# Clear and regenerate Prisma Client
rm -rf generated/prisma
npm run db:generate
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Create migrations for schema changes
4. Test thoroughly
5. Submit a pull request

## License

ISC

## Support

For issues and questions:
- Check documentation in `prisma/` directory
- Review Prisma official documentation
- Open an issue on GitHub
