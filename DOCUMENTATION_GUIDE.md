# Documentation Guide

Complete guide to navigating and maintaining the Invoice SaaS documentation.

## Quick Navigation

**I want to...**

- **Get started quickly** → [QUICK_START.md](QUICK_START.md)
- **Install locally** → [INSTALLATION.md](INSTALLATION.md)
- **Understand the architecture** → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Use the API** → [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Contribute code** → [CONTRIBUTING.md](CONTRIBUTING.md)
- **Report a security issue** → [SECURITY.md](SECURITY.md)
- **Understand SLAs** → [docs/SLA.md](docs/SLA.md)
- **Handle incidents** → [docs/RUNBOOK.md](docs/RUNBOOK.md)
- **View all documentation** → [docs/INDEX.md](docs/INDEX.md)

## Documentation Structure

### Root Level Documentation

**Getting Started**
```
QUICK_START.md          5-minute setup guide
INSTALLATION.md         Detailed installation
README.md              Project overview
```

**Development**
```
CONTRIBUTING.md        Development workflow
API_DOCUMENTATION.md   API reference
CHANGELOG.md          Version history
```

**Legal & Security**
```
LICENSE               MIT License
SECURITY.md          Security policies
```

**Navigation**
```
DOCUMENTATION_GUIDE.md  This file
.docs-map.md           Quick navigation map
```

### Technical Documentation (/docs)

**Architecture & Design**
```
docs/
├── INDEX.md                  Documentation index
├── README.md                System overview
├── ARCHITECTURE.md          Architecture details
├── DATABASE.md              Database design
├── SCHEMA_REFERENCE.md      Schema documentation
└── .meta.yml               Documentation metadata
```

**Operations**
```
docs/
├── RUNBOOK.md              Operations guide
├── SLA.md                  Service level agreements
├── DEPLOYMENT_GUIDE.md     Deployment procedures
└── COST_ANALYSIS.md        Infrastructure costs
```

**Development**
```
docs/
├── TESTING_STRATEGY.md     Testing approach
├── API_VERSIONING.md       API version strategy
├── I18N.md                 Internationalization
└── I18N_STRINGS.md         Translation strings
```

## Documentation Standards

### Style Guidelines

**Tone**
- Professional and corporate
- Clear and concise
- Technical but accessible
- No emojis or decorative elements

**Structure**
- Use ATX-style headers (#, ##, ###)
- Bold text for emphasis
- Code blocks with language specification
- Tables for structured data
- Lists for sequential items

**Example**
```markdown
## Section Title

**Key Point**
- Item one
- Item two

```bash
# Code example
command --flag value
```
```

### File Organization

**Naming Conventions**
- UPPERCASE.md for root-level docs
- lowercase.md for technical docs
- Use hyphens for multi-word files

**Required Sections**
- Title (H1)
- Overview or introduction
- Table of contents (for long docs)
- Sections with clear headers
- Examples where appropriate
- Resources or links section

### Content Guidelines

**Do**
- Use active voice
- Keep paragraphs short (3-4 lines)
- Include code examples
- Link to related documentation
- Update dates and versions
- Test all code examples
- Use consistent terminology

**Don't**
- Use emojis or decorative symbols
- Write walls of text
- Include outdated information
- Link to external docs for critical info
- Use vague language
- Skip context

## Documentation Maintenance

### Regular Updates

**Monthly**
- Review and update API documentation
- Check for broken links
- Verify code examples work
- Update version numbers
- Review metrics and SLA data

**Quarterly**
- Comprehensive documentation audit
- Update architecture diagrams
- Review and update SLA terms
- Refresh cost analysis
- Update contributor guidelines

**Annually**
- Major documentation overhaul
- Review entire information architecture
- Update style guide if needed
- Gather user feedback
- Archive obsolete documentation

### Validation

**Automated Checks**
```bash
# Validate all documentation
npm run docs:validate

# Check specific aspects
bash scripts/validate-docs.sh
```

**Manual Review**
- [ ] All required files present
- [ ] No broken links
- [ ] Code examples tested
- [ ] Consistent formatting
- [ ] Up-to-date version info
- [ ] Proper cross-references
- [ ] Clear and accurate

### Version Control

**Branching**
- Documentation changes use feature branches
- Follow git flow conventions
- Prefix branches with `docs/`

**Commit Messages**
```
docs: add API versioning strategy

Detailed description of changes...

Closes #123
```

**Pull Requests**
- Require review for major changes
- Run validation before merging
- Update changelog
- Link to related issues

## Contributing to Documentation

### Making Changes

1. **Create Branch**
   ```bash
   git checkout -b docs/your-feature
   ```

2. **Make Changes**
   - Follow style guidelines
   - Test code examples
   - Update related docs

3. **Validate**
   ```bash
   npm run docs:validate
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "docs: brief description"
   ```

5. **Submit PR**
   - Describe changes
   - Link to issues
   - Request review

### Review Checklist

**Content**
- [ ] Accurate and complete
- [ ] Appropriate detail level
- [ ] Clear examples
- [ ] Proper context

**Style**
- [ ] Follows style guide
- [ ] Consistent tone
- [ ] No emojis
- [ ] Proper formatting

**Technical**
- [ ] Code examples work
- [ ] Links are valid
- [ ] Commands are correct
- [ ] API references accurate

**Metadata**
- [ ] Updated dates
- [ ] Correct version
- [ ] Proper file location
- [ ] Cross-references updated

## Tools and Automation

### Validation Script

**Location**: `scripts/validate-docs.sh`

**Checks**
- Required files present
- Code blocks balanced
- No emojis (style check)
- File structure correct

**Usage**
```bash
bash scripts/validate-docs.sh
npm run docs:validate
```

### Documentation Metadata

**Location**: `docs/.meta.yml`

**Contains**
- Version information
- Maintenance schedule
- File structure
- Validation rules
- Style standards

### Link Checking

**Automated**
- Pre-commit hooks
- CI/CD pipeline
- Pull request checks

**Manual**
- Quarterly review
- Before major releases

## Best Practices

### For Readers

**Finding Information**
1. Start with [docs/INDEX.md](docs/INDEX.md)
2. Use [.docs-map.md](.docs-map.md) for quick navigation
3. Search within specific documents
4. Check related documents section

**Understanding Context**
- Read overview sections first
- Check prerequisites
- Review examples
- Follow related links

### For Writers

**Planning**
- Understand audience
- Define scope
- Outline structure
- Identify examples needed

**Writing**
- Start with overview
- Use clear headers
- Include examples
- Add cross-references
- Provide context

**Reviewing**
- Read aloud
- Check all links
- Test code examples
- Verify technical accuracy
- Get peer review

## Troubleshooting

### Common Issues

**Validation Failures**
```bash
# Check what's wrong
bash scripts/validate-docs.sh

# Common fixes:
# - Add missing files
# - Balance code blocks (```)
# - Fix broken links
# - Update file structure
```

**Broken Links**
- Verify file exists
- Check path is correct
- Ensure proper capitalization
- Update if file moved

**Formatting Issues**
- Check markdown syntax
- Verify code block language
- Ensure table formatting
- Validate list indentation

## Resources

### Internal

- [Documentation Index](docs/INDEX.md)
- [Documentation Map](.docs-map.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

### External

- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Markdown](https://guides.github.com/features/mastering-markdown/)
- [Docs Best Practices](https://documentation.divio.com/)

## Support

**Questions or Issues**
- Create GitHub issue
- Tag with `documentation`
- Provide specific details
- Suggest improvements

**Feedback**
- Email: docs@invoice-saas.com
- Slack: #documentation
- Survey: Quarterly feedback form

---

**Last Updated**: 2024-10-27  
**Version**: 1.0.0  
**Maintained By**: Platform Team
