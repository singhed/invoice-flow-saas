# API Versioning Strategy

## Overview

Invoice SaaS API follows semantic versioning principles with URL-based versioning for major releases and header-based versioning for minor updates.

## Versioning Scheme

**URL-Based Versioning**

Major version included in URL path:
```
https://api.invoice-saas.com/v1/invoices
https://api.invoice-saas.com/v2/invoices
```

**Header-Based Versioning**

Minor and patch versions via headers:
```
Accept: application/vnd.invoice-saas.v1.2+json
API-Version: 2024-10-27
```

## Version Lifecycle

**Supported Versions**

| Version | Status | Release Date | End of Support | End of Life |
|---------|--------|--------------|----------------|-------------|
| v1.0 | Current | 2024-01-15 | 2025-01-15 | 2025-07-15 |
| v1.1 | Beta | 2024-10-01 | - | - |
| v2.0 | Planned | 2025-01-15 | - | - |

**Support Policy**
- Active support: 12 months from release
- Security updates: 6 months after active support ends
- Minimum supported version: n-1 (one version back)

## Breaking Changes

**Major Version Changes (v1 → v2)**
- Endpoint structure changes
- Request/response schema changes
- Authentication mechanism changes
- Default behavior changes

**Minor Version Changes (v1.0 → v1.1)**
- New optional parameters
- New endpoints
- Deprecation warnings
- Bug fixes with behavioral changes

**Patch Version Changes (v1.0.0 → v1.0.1)**
- Bug fixes without behavioral changes
- Performance improvements
- Documentation updates

## Deprecation Process

**Timeline**
1. Announcement: Feature marked as deprecated (6 months before removal)
2. Warning: API returns deprecation headers (3 months before removal)
3. Removal: Feature removed in next major version

**Deprecation Headers**
```
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: <https://docs.invoice-saas.com/api/migration>; rel="deprecation"
```

## Migration Guide

**Version Migration Steps**
1. Review changelog and migration guide
2. Test in development environment
3. Update client libraries
4. Monitor error rates
5. Migrate production traffic gradually
6. Complete migration before EOL

**Backward Compatibility**
- Query parameters: Additive only
- Response fields: Never removed in minor versions
- Required fields: Never added in minor versions
- Error codes: Maintained across versions

## API Version Detection

**Client Version Declaration**
```bash
curl -H "API-Version: 2024-10-27" \
     -H "Accept: application/vnd.invoice-saas.v1+json" \
     https://api.invoice-saas.com/v1/invoices
```

**Version Negotiation**
- Client requests specific version
- Server returns best compatible version
- Unsupported version returns 406 Not Acceptable

## Best Practices

**For API Consumers**
- Always specify API version explicitly
- Subscribe to deprecation notifications
- Test against new versions before GA
- Implement graceful degradation
- Monitor deprecation headers

**For API Developers**
- Document all breaking changes
- Provide migration guides
- Maintain backward compatibility within major versions
- Use feature flags for gradual rollouts
- Version all API contracts

## Resources

- [Changelog](../CHANGELOG.md) - Version history
- [API Documentation](../API_DOCUMENTATION.md) - Current API reference
- [Migration Guides](migrations/) - Version-specific migration guides
