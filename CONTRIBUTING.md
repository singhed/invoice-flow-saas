# Contributing

## Development Workflow

**Branch Strategy**

- `main` Production releases
- `develop` Active development
- `feature/*` Feature branches
- `fix/*` Bug fixes

**Pull Requests**

1. Fork and create feature branch
2. Make changes with tests
3. Run quality checks
4. Submit PR with description
5. Address review feedback

## Code Standards

**TypeScript**

- Strict type checking enabled
- No implicit any
- Explicit return types for functions
- Interface over type when possible

**Style**

- ESLint configuration enforced
- Prettier for formatting
- 2-space indentation
- 80-character line limit

**Testing**

- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical paths
- Minimum 80% coverage

## Commit Guidelines

**Format**

```
type(scope): subject

body

footer
```

**Types**

- `feat` New feature
- `fix` Bug fix
- `docs` Documentation
- `style` Formatting
- `refactor` Code restructuring
- `test` Testing
- `chore` Maintenance

**Example**

```
feat(invoice): add PDF export

Implement PDF generation using Puppeteer with custom templates.
Includes S3 upload and signed URL generation.

Closes #123
```

## Development Commands

**Setup**

```bash
pnpm install
docker-compose up -d
pnpm --filter @invoice-saas/invoice-service prisma:migrate:dev
```

**Development**

```bash
pnpm dev
pnpm run lint
pnpm run typecheck
pnpm run format
```

**Testing**

```bash
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
pnpm run test:coverage
```

**Database**

```bash
pnpm --filter @invoice-saas/invoice-service prisma:migrate:dev
pnpm --filter @invoice-saas/invoice-service prisma:studio
pnpm --filter @invoice-saas/invoice-service prisma:generate
```

## Architecture Guidelines

**Microservices**

- Single responsibility per service
- API contracts via OpenAPI
- Event-driven communication
- Independent deployment

**Database**

- One database per service
- Migrations via Prisma
- Soft deletes for audit trail
- Indexing for performance

**API Design**

- RESTful endpoints
- Consistent naming conventions
- Proper HTTP status codes
- Pagination for lists
- Rate limiting

**Security**

- JWT authentication
- RBAC authorization
- Input validation
- SQL injection prevention
- XSS protection

## Code Review

**Checklist**

- [ ] Tests pass locally
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] No sensitive data exposed
- [ ] Error handling implemented
- [ ] Logging added
- [ ] Performance considered

**Review Focus**

- Logic correctness
- Test coverage
- Security implications
- Performance impact
- Maintainability

## Release Process

**Version Numbering**

Semantic versioning: `MAJOR.MINOR.PATCH`

- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

**Release Steps**

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release branch
4. Run full test suite
5. Deploy to staging
6. Tag release
7. Deploy to production
8. Monitor metrics

## Resources

- [README.md](README.md) Project overview
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) API reference
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) Architecture details
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) Deployment guide
