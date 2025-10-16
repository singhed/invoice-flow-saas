# Reporting & Analytics Dashboard

A full-stack application for financial reporting and analytics with real-time data visualizations, built with React, Express, Prisma, and Recharts.

## Features

### Backend
- **Prisma ORM** with PostgreSQL for data management
- **Express.js API** with RESTful endpoints
- **Advanced Aggregations** for financial metrics:
  - Monthly income trends
  - Outstanding balances by status
  - Top clients by revenue
  - Estimated tax calculations
- **In-memory caching** with node-cache for performance optimization
- **Database seeding** with realistic sample data

### Frontend
- **React 18** with TypeScript
- **Recharts** for interactive data visualizations
- **Date range filters** for custom reporting periods
- **Client-specific filtering** for targeted analytics
- **Loading states** for better UX
- **Responsive design** for all screen sizes

### Visualizations
- 📊 **Monthly Income Chart**: Bar and line charts showing revenue trends
- 💰 **Outstanding Balances**: Pie chart breakdown by invoice status
- 🏆 **Top Clients**: Horizontal bar chart and detailed table
- 💵 **Estimated Taxes**: Interactive cards with tax breakdowns

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Recharts, React DatePicker
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: node-cache
- **Development**: tsx (TypeScript execution), Vite (dev server)

## Project Structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Sample data seeder
│   ├── src/
│   │   ├── index.ts           # Express server
│   │   ├── routes/
│   │   │   └── reports.ts     # API routes
│   │   ├── services/
│   │   │   └── reportService.ts  # Business logic
│   │   └── lib/
│   │       ├── prisma.ts      # Prisma client
│   │       └── cache.ts       # Cache configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── api/              # API client
│   │   ├── types/            # TypeScript types
│   │   └── main.tsx          # Entry point
│   └── package.json
└── package.json              # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   
   Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/reporting_db?schema=public"
   PORT=3001
   NODE_ENV=development
   ```

3. **Generate Prisma client and run migrations:**
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Seed the database with sample data:**
   ```bash
   npm run prisma:seed
   ```

### Development

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

**Backend (port 3001):**
```bash
npm run dev:backend
```

**Frontend (port 3000):**
```bash
npm run dev:frontend
```

Visit http://localhost:3000 to access the dashboard.

## API Endpoints

### Reports

- `GET /api/reports/monthly-income` - Get monthly income data
  - Query params: `startDate`, `endDate` (ISO format)
  
- `GET /api/reports/outstanding-balances` - Get outstanding balances
  - Query params: `clientId` (optional)
  
- `GET /api/reports/top-clients` - Get top clients by revenue
  - Query params: `limit`, `startDate`, `endDate`
  
- `GET /api/reports/estimated-taxes` - Get estimated tax calculations
  - Query params: `year`
  
- `GET /api/reports/clients` - Get all clients
  
- `POST /api/reports/clear-cache` - Clear the API cache

### Example API Calls

```bash
# Get monthly income for 2024
curl "http://localhost:3001/api/reports/monthly-income?startDate=2024-01-01&endDate=2024-12-31"

# Get top 5 clients
curl "http://localhost:3001/api/reports/top-clients?limit=5"

# Get estimated taxes for 2024
curl "http://localhost:3001/api/reports/estimated-taxes?year=2024"
```

## Database Schema

### Client
- Basic client information (name, email, company, contact details)
- One-to-many relationship with invoices

### Invoice
- Invoice details with amounts and tax
- Status tracking (PENDING, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED)
- Dates for issue, due, and payment
- Many-to-one relationship with client
- One-to-many relationship with payments

### Payment
- Payment records linked to invoices
- Amount, date, method, and notes

## Caching Strategy

The application implements intelligent caching for expensive queries:
- **TTL**: 5 minutes (300 seconds)
- **Cache Keys**: Parameterized by query filters
- **Invalidation**: Manual via API endpoint or automatic expiry

Benefits:
- Reduced database load
- Faster response times for repeated queries
- Better scalability

## Features in Detail

### Filters
- **Date Range**: Filter data by custom start and end dates
- **Client Filter**: View metrics for specific clients
- **Tax Year**: Select different years for tax calculations
- **Clear Filters**: Reset all filters to defaults

### Loading States
- Full-page loading spinner on initial load
- Overlay spinner when applying filters
- Graceful error handling with retry option

### Responsive Design
- Mobile-friendly layouts
- Adaptive grid system
- Touch-friendly controls

## Building for Production

```bash
# Build both frontend and backend
npm run build

# Start production server
cd backend && npm start
```

## Development Tools

- **Prisma Studio**: Visual database editor
  ```bash
  cd backend && npm run prisma:studio
  ```

- **Database Migrations**: Create new migrations
  ```bash
  cd backend && npm run prisma:migrate
  ```

## Future Enhancements

- [ ] Export reports to PDF/CSV
- [ ] Real-time updates with WebSockets
- [ ] Advanced filtering and sorting
- [ ] User authentication and authorization
- [ ] Multi-currency support
- [ ] Customizable dashboard layouts
- [ ] Email notifications for overdue invoices
- [ ] Comparison views (YoY, MoM)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
