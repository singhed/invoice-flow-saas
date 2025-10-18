# Expense Management Web App

A modern Next.js 14 application with TypeScript, App Router, and Tailwind CSS for expense management.

## Features

- ✅ **Next.js 14** with App Router
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS** for styling
- ✅ **ESLint** and **Prettier** for code quality
- ✅ **Environment validation** with Zod
- ✅ **Typed API client** for backend communication
- ✅ **Server Components** for optimal performance
- ✅ **Performance optimizations** (tree shaking, image optimization, dynamic imports)

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- pnpm 8.15.8+

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Setup

Create a `.env.local` file in the root of the web app:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=Expense Management
```

### Development

```bash
# Start the development server
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript type checking

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with navbar
│   ├── page.tsx           # Home page with health check
│   ├── invoices/          # Invoices route
│   │   └── page.tsx       # Invoices list page
│   └── globals.css        # Global styles with Tailwind
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # UI components (Button, Card, etc.)
│   │   └── Navbar.tsx    # Navigation component
│   ├── lib/
│   │   ├── api/          # API client
│   │   │   ├── client.ts # Typed API client functions
│   │   │   ├── types.ts  # API type definitions
│   │   │   └── index.ts  # Exports
│   │   └── utils.ts      # Utility functions
│   └── env.mjs           # Environment validation
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
├── .prettierrc           # Prettier configuration
└── tsconfig.json         # TypeScript configuration
```

## API Client

The app includes a fully typed API client that communicates with the Go backend:

```typescript
import { getExpenses, getHealth } from "@/lib/api";

// Check backend health
const health = await getHealth();

// Fetch expenses
const expenses = await getExpenses({ limit: 100 });
```

## Performance Features

- **Tree Shaking**: Automatic dead code elimination
- **Image Optimization**: Next.js Image component with AVIF/WebP support
- **Server Components**: Default to server components for better performance
- **Dynamic Imports**: Code splitting for optimal bundle sizes
- **SWC Minification**: Fast and efficient code minification

## Backend Integration

The app connects to a Go backend API. Make sure the backend is running at the URL specified in `NEXT_PUBLIC_API_URL`.

Health check endpoint: `GET /healthz`

## Development Guidelines

- Use server components by default for optimal performance
- Use client components (`"use client"`) only when needed (for interactivity)
- Follow the existing component patterns in `src/components/ui/`
- Use the typed API client from `@/lib/api` for all backend requests
- Format code with Prettier before committing

## License

MIT
