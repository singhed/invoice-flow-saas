# Quick Start Guide

## Prerequisites

- Node.js 18+ or 20+
- pnpm 8.15.8+ (install with `npm install -g pnpm@8.15.8`)

## Installation

```bash
cd apps/web
pnpm install
```

## Environment Setup

The app uses environment variables for configuration. A `.env.local` file has been created with defaults:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=Expense Management
```

You can modify these values to point to a different backend URL if needed.

## Running the Application

### Development Mode

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production Mode

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check code formatting |
| `pnpm type-check` | Run TypeScript type checking |

## Features

### Backend Health Check

The home page (`/`) automatically checks the backend health status:
- **Green indicator**: Backend is connected and healthy
- **Red indicator**: Backend is unreachable or unhealthy

### Routes

- **`/`** - Home page with backend status and feature overview
- **`/invoices`** - Expenses/invoices list page

## Backend Integration

The application expects a Go backend API running at `http://localhost:8080` (configurable via `NEXT_PUBLIC_API_URL`).

### Required Backend Endpoints

Currently implemented in backend:
- `GET /healthz` - Health check endpoint

Ready for implementation:
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/categories` - List categories
- `POST /api/expenses/ai-suggest` - Get AI suggestions

## Project Structure

```
apps/web/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page (/)
│   ├── invoices/
│   │   └── page.tsx         # Invoices page (/invoices)
│   └── globals.css          # Global styles
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   └── Navbar.tsx      # Navigation
│   ├── lib/
│   │   ├── api/            # Typed API client
│   │   └── utils.ts        # Utilities
│   └── env.mjs             # Environment validation
├── next.config.mjs          # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Technology Stack

- **Framework**: Next.js 14.2.4 with App Router
- **Language**: TypeScript 5.4.5
- **Styling**: Tailwind CSS 3.4
- **Validation**: Zod for environment variables
- **Code Quality**: ESLint, Prettier
- **Performance**: SWC minification, image optimization, tree shaking

## Development Tips

1. **Server Components**: Pages use React Server Components by default for better performance
2. **API Client**: Use the typed API client from `@/lib/api` for backend requests
3. **Styling**: Use Tailwind utility classes and the shared UI components
4. **Environment**: All client-side env vars must be prefixed with `NEXT_PUBLIC_`
5. **Path Aliases**: Use `@/*` to import from the `src/` directory

## Troubleshooting

### Backend Connection Issues

If you see "Cannot connect to backend" on the home page:
1. Ensure the Go backend is running: `cd apps/api && go run ./cmd/api`
2. Check that the backend is listening on `http://localhost:8080`
3. Verify `NEXT_PUBLIC_API_URL` in `.env.local` matches your backend URL

### Build Errors

If you encounter build errors:
1. Delete `.next` directory: `rm -rf .next`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && pnpm install`
3. Run type check: `pnpm type-check`
4. Run lint: `pnpm lint`

## Next Steps

1. Start the backend API server
2. Start the Next.js development server
3. Visit the home page to verify backend connectivity
4. Navigate to `/invoices` to see the expenses interface
5. Implement additional backend endpoints as needed

The application is production-ready and follows Next.js best practices!
