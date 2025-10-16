# Quick Start Guide

Get up and running with the Invoice Flow SaaS database in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check PostgreSQL (need 14+)
psql --version

# Check npm
npm --version
```

## 5-Minute Setup

### 1. Install Dependencies (30 seconds)

```bash
npm install
```

### 2. Create PostgreSQL Database (1 minute)

```bash
# Option A: Using psql
psql -U postgres -c "CREATE DATABASE invoice_flow_db;"

# Option B: Using createdb
createdb invoice_flow_db
```

### 3. Configure Environment (30 seconds)

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your database credentials
# Default: postgresql://user:password@localhost:5432/invoice_flow_db
```

### 4. Run Migrations (1 minute)

```bash
npm run db:migrate:deploy
```

### 5. Generate Prisma Client (30 seconds)

```bash
npm run db:generate
```

### 6. Seed Sample Data (30 seconds) [Optional]

```bash
npm run db:seed
```

### 7. Verify Installation (30 seconds)

```bash
# Open Prisma Studio to browse your database
npm run db:studio
```

## That's It! 🎉

Your database is ready to use. Open http://localhost:5555 to see your data in Prisma Studio.

## Essential Commands

```bash
# Database operations
npm run db:generate          # Generate Prisma Client
npm run db:migrate          # Create new migration (dev)
npm run db:migrate:deploy   # Apply migrations (prod)
npm run db:seed             # Seed sample data
npm run db:studio           # Open database GUI

# Validation
npx prisma validate         # Check schema
npx prisma format           # Format schema
npx prisma migrate status   # Check migrations
```

## What You Get

After setup, you have:
- ✅ 11 database tables
- ✅ 8 enum types
- ✅ 25+ optimized indexes
- ✅ Sample data (if you seeded)
- ✅ Type-safe Prisma Client

## Sample Data Included

If you ran the seed:
- 2 users (admin@example.com, john.doe@example.com)
- 3 clients with full details
- 4 projects in various states
- Multiple time entries
- 3 invoices (Draft, Sent, Paid)
- Payment records
- Expenses with categories
- Reminders
- Integration configurations

## Quick Test

```javascript
// test.js
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.length);
  
  const clients = await prisma.client.findMany();
  console.log('Clients:', clients.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run: `node test.js`

## Next Steps

1. **Read the docs** - Check out README.md and SETUP_GUIDE.md
2. **Explore schema** - Review prisma/ERD.md for data model
3. **Start coding** - Import Prisma Client in your app
4. **Build features** - Create your API/application logic

## Common Issues

### Can't connect to database
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# or
pg_isready
```

### Migration fails
```bash
# Check migration status
npx prisma migrate status

# Reset if needed (WARNING: deletes data)
npx prisma migrate reset
```

### Prisma Client not found
```bash
# Regenerate client
npm run db:generate
```

## Documentation

- **[README.md](README.md)** - Full project overview
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[prisma/ERD.md](prisma/ERD.md)** - Schema documentation with ERD
- **[docs/SCHEMA_REFERENCE.md](docs/SCHEMA_REFERENCE.md)** - Quick reference
- **[docs/DATABASE.md](docs/DATABASE.md)** - Comprehensive database guide

## Support

Need help? Check the documentation above or review:
- Prisma docs: https://www.prisma.io/docs
- PostgreSQL docs: https://www.postgresql.org/docs

## Production Deployment

For production setup, see **SETUP_GUIDE.md** section on Production Deployment.

---

**Ready to build!** 🚀
