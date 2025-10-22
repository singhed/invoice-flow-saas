# Files Overview

## Core Configuration Files

| File                 | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `next.config.mjs`    | Next.js configuration with performance optimizations |
| `tsconfig.json`      | TypeScript configuration with path aliases           |
| `tailwind.config.ts` | Tailwind CSS configuration                           |
| `postcss.config.js`  | PostCSS configuration for Tailwind                   |
| `.eslintrc.json`     | ESLint configuration                                 |
| `.prettierrc`        | Prettier code formatting rules                       |
| `.prettierignore`    | Files to ignore for Prettier                         |
| `.gitignore`         | Git ignore patterns                                  |
| `.env.local`         | Local environment variables (not committed)          |
| `package.json`       | Dependencies and scripts                             |

## Application Routes

| File                    | Route       | Description                               |
| ----------------------- | ----------- | ----------------------------------------- |
| `app/layout.tsx`        | All routes  | Root layout with navbar and global styles |
| `app/page.tsx`          | `/`         | Home page with backend health check       |
| `app/invoices/page.tsx` | `/invoices` | Expenses/invoices list page               |
| `app/globals.css`       | N/A         | Global Tailwind CSS styles                |

## API Client

| File                    | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `src/lib/api/client.ts` | Typed API client functions for backend communication |
| `src/lib/api/types.ts`  | TypeScript type definitions for API responses        |
| `src/lib/api/index.ts`  | Exports API client and types                         |

## Components

### UI Components (`src/components/ui/`)

| File          | Component       | Description                            |
| ------------- | --------------- | -------------------------------------- |
| `Button.tsx`  | `<Button>`      | Multi-variant button component         |
| `Card.tsx`    | `<Card>` family | Card components for content containers |
| `Loading.tsx` | `<Loading>`     | Loading spinner with size variants     |
| `index.ts`    | N/A             | Exports all UI components              |

### Layout Components (`src/components/`)

| File         | Component  | Description                |
| ------------ | ---------- | -------------------------- |
| `Navbar.tsx` | `<Navbar>` | Application navigation bar |

## Utilities

| File               | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `src/lib/utils.ts` | Utility functions (className merging)    |
| `src/env.mjs`      | Environment variable validation with Zod |

## Documentation

| File                        | Purpose                             |
| --------------------------- | ----------------------------------- |
| `README.md`                 | Comprehensive project documentation |
| `QUICK_START.md`            | Quick start guide for developers    |
| `IMPLEMENTATION_SUMMARY.md` | Detailed implementation notes       |
| `CHECKLIST.md`              | Implementation checklist            |
| `FILES_OVERVIEW.md`         | This file - overview of all files   |

## Key Features

### Environment Variables (`.env.local`)

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: http://localhost:8080)
- `NEXT_PUBLIC_APP_NAME` - Application name (default: Expense Management)

### API Client Functions

- `getHealth()` - Check backend health
- `getExpenses()` - List expenses
- `getExpense(id)` - Get single expense
- `createExpense()` - Create new expense
- `updateExpense()` - Update expense
- `deleteExpense()` - Delete expense
- `getCategories()` - Get expense categories
- `getAISuggestion()` - Get AI suggestions

### UI Components

- **Button**: Primary, secondary, outline, and danger variants
- **Card**: Flexible card container with header, title, description, content, and footer
- **Loading**: Spinner with small, medium, and large sizes
- **Navbar**: Responsive navigation with links

### Performance Optimizations

- Tree shaking enabled
- SWC minification
- Image optimization (AVIF/WebP)
- Server components by default
- Console removal in production
- Dynamic imports support

## File Counts

- **TypeScript/TSX files**: 15
- **Configuration files**: 9
- **Documentation files**: 5
- **Total lines of code**: ~2,000+

## Import Patterns

### Using UI Components

```typescript
import { Button, Card, Loading } from "@/components/ui";
```

### Using API Client

```typescript
import { getExpenses, getHealth } from "@/lib/api";
```

### Using Environment Variables

```typescript
import { env } from "@/env.mjs";
const apiUrl = env.NEXT_PUBLIC_API_URL;
```

## Development Workflow

1. **Start Development**: `pnpm dev`
2. **Make Changes**: Edit TypeScript/React files
3. **Format Code**: `pnpm format`
4. **Check Types**: `pnpm type-check`
5. **Lint Code**: `pnpm lint`
6. **Build for Production**: `pnpm build`
7. **Start Production**: `pnpm start`
