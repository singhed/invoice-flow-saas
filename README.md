# Next.js + Go Monorepo Starter

This repository provides a unified developer experience for building a modern product with a
Next.js frontend and a Go backend. The project is organised as a monorepo using PNPM workspaces
and a shared Makefile to streamline local development and automation.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) 14, React 18, TypeScript
- **Backend**: Go 1.21 with the standard library
- **Tooling**: PNPM workspaces, Makefile helpers, shared environment configuration

## Project Structure

```
.
├── apps/
│   ├── api/        # Go HTTP service
│   │   ├── cmd/    # Executable entrypoints
│   │   └── internal/server
│   └── web/        # Next.js application (app router)
├── .env.example    # Documented environment variables for all services
├── Makefile        # Helper targets for running apps together or independently
├── package.json    # Root workspace scripts
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- [PNPM](https://pnpm.io/) 8+
- Node.js 18+
- Go 1.21+

### Installation

```bash
# Install frontend dependencies
pnpm install

# Download Go modules
cd apps/api && go mod tidy
```

Alternatively, run the composite Makefile target:

```bash
make install
```

### Environment Variables

Copy `.env.example` to `.env` at the repository root (PNPM and Go both respect
variables exported in the current shell) and adjust any values for your setup.
The most important variables are:

- `NEXT_PUBLIC_API_URL` – Base URL the Next.js application uses to talk to the Go API
- `API_HOST` / `API_PORT` – Interface and port the Go API listens on
- `API_ALLOWED_ORIGINS` – Comma-separated list of origins allowed by the API CORS middleware

### Running the Apps

Use the Makefile to launch the frontend and backend concurrently:

```bash
make dev
```

Individual services can be started separately if required:

```bash
# Next.js only
make dev-web

# Go API only
make dev-api
```

The Next.js development server listens on [http://localhost:3000](http://localhost:3000) and the Go API
exposes health and example endpoints on [http://localhost:8080](http://localhost:8080).

### Building

```bash
# Build both services
make build

# Or just the web application
pnpm run build
```

## Extending the Stack

- Add new environment variables to `.env.example` to keep documentation up to date.
- Extend the Go API by adding routes under `internal/server` or introducing additional
  packages and registering handlers in `registerRoutes`.
- Install additional frontend packages with `pnpm add <package> --filter web` to scope
dependencies to the Next.js app.

## License

This starter is provided as-is without warranty. Use it as the foundation for your own product,
and adapt it to your team's requirements.
