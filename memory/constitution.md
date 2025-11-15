# Project Constitution - Ronin Job Hunter

## Core Principles

### Code Quality
- All code must be type-safe (TypeScript for frontend, type hints for Python/Node.js)
- Follow existing code style and conventions
- Write self-documenting code with clear variable names
- Implement proper error handling and logging
- No hardcoded credentials or secrets

### Testing Standards
- Write tests for critical business logic (scoring engine, dedupe logic)
- Test error handling and edge cases
- Validate Notion API integration with mock data
- Test PDF generation for deterministic output
- End-to-end tests for complete workflows

### User Experience
- Mobile-first design (primary use case: reviewing jobs on phone)
- Touch-optimized UI (48px minimum tap targets)
- Swipe gestures for quick actions
- Progressive Web App (PWA) for offline access
- Fast load times and responsive interactions

### Performance Requirements
- Job discovery workflow completes in <5 minutes for 10 jobs
- Frontend loads in <2 seconds
- PDF generation completes in <30 seconds per job
- Notion API calls respect rate limits (3 requests/second)
- Efficient database queries with proper indexing

### Architecture Principles
- Repository pattern for data access (enables future migration)
- SQLite as source of truth, Notion as sync target
- Modular n8n workflows for maintainability
- Separation of concerns: discovery, scoring, generation, sync
- Configuration-driven (YAML/JSON) for easy adjustments

### Security
- Credentials stored in .env files only (never in code or Notion)
- Docker secrets for production
- Rate limiting to respect site ToS
- No aggressive scraping; backoff and scheduling required
- Human-in-loop fallback for CAPTCHA/2FA

### Documentation
- Keep Notion documentation in sync with code
- Document all API endpoints and workflows
- Maintain clear README with setup instructions
- Update Sprint execution logs as work progresses
- Link spec-kit docs to Notion pages

## Development Workflow

### Task Management
- Use Archon for task tracking (todo → doing → review → complete)
- Sync tasks between Archon and Notion
- Link tasks to Sprint stories and spec-kit documentation
- Update task status as work progresses

### Code Review
- All changes must be reviewed before merging
- Follow existing architecture patterns
- Ensure backward compatibility where possible
- Document breaking changes

### Deployment
- Test locally before deploying
- Use dry-run mode for testing workflows
- Verify all environment variables are set
- Check logs for errors after deployment

