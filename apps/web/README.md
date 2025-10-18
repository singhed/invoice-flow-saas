# Expense Management Web App

A modern Next.js 14 application with TypeScript, App Router, Tailwind CSS, Radix UI, Framer Motion, and a comprehensive Storybook-driven UI system.

## Features

- ✅ **Next.js 14** with App Router
- ✅ **TypeScript** (strict) for type safety
- ✅ **Tailwind CSS** with design tokens via CSS variables
- ✅ **Radix Primitives** with accessible patterns
- ✅ **class-variance-authority** + **tailwind-merge** for variants
- ✅ **Framer Motion** with reduced-motion support
- ✅ **Storybook 8** with Docs/Controls/A11y + dark mode
- ✅ **ESLint** and **Prettier** for code quality
- ✅ **Environment validation** with Zod
- ✅ **Typed API client** for backend communication

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

The app will be available at http://localhost:3000.

### Storybook

```bash
# Start Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook
```

Storybook showcases all UI components with variants, accessibility, and dark mode.

### Tests

```bash
# Run unit tests (Vitest + Testing Library)
pnpm test

# Watch mode
pnpm test:watch
```

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with navbar + ThemeProvider
│   ├── page.tsx           # Landing page (hero, stats, backend health)
│   ├── invoices/          # Invoices route
│   │   └── page.tsx       # Invoices list page
│   └── globals.css        # Global styles + design tokens (CSS variables)
├── src/
│   ├── components/
│   │   ├── atoms/         # Buttons, inputs, form controls, badges, etc.
│   │   ├── molecules/     # Card composition, Dialog wrappers, Tabs, etc.
│   │   ├── organisms/     # Sidebar, PageHeader, DataTable
│   │   └── templates/     # Dashboard shell, Settings page, Auth form
│   ├── lib/
│   │   ├── api/          # API client
│   │   └── utils.ts      # Utility functions
│   ├── providers/        # ThemeProvider
│   └── styles/           # Token exports (TS)
├── .storybook/            # Storybook config
├── vitest.config.ts       # Vitest config (jsdom, setup)
├── tailwind.config.ts     # Tailwind configuration (tokens mapped to theme)
└── tsconfig.json         # TypeScript configuration
```

## Theming

- Light/dark themes via class strategy with system preference sync.
- CSS variables defined in `app/globals.css` map to Tailwind theme tokens.
- Use semantic Tailwind classes (e.g., `bg-background`, `text-foreground`, `ring`) across components.

## UI Kit

Navigate to `/ui-kit` in the running app to preview the UI system live, including dialogs, tabs, tooltips, badges, inputs, pagination, and toasts.

## Backend Integration

The app connects to a Go backend API. Make sure the backend is running at the URL specified in `NEXT_PUBLIC_API_URL`.

Health check endpoint: `GET /healthz`

## Contribution Notes

- Prefer server components when possible; mark interactivity with `"use client"`.
- Follow the atomic design structure and component patterns.
- Keep accessibility (WCAG 2.1 AA) top-of-mind: labels, roles, keyboard navigation, focus-visible rings.
- Respect reduced-motion preferences for any animations.
- Run `pnpm lint` and `pnpm test` before committing.

## License

MIT
