# Implementation Plan: Ronin Job Hunter

## Tech Stack

### Backend Orchestration
- **n8n**: Workflow automation platform (Docker container)
- **Chrome DevTools Protocol (CDP)**: Browser automation for job board access
- **SQLite**: Local data storage with migrations
- **Notion API**: Sync target for Jobs and Applications databases
- **OpenAI GPT-4o-mini**: AI for keyword extraction and content tailoring (temperature 0.2)
- **Puppeteer**: PDF generation from HTML templates

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **TanStack Query**: Data fetching and caching
- **Sentry**: Error tracking
- **Posthog**: Analytics (optional)

### Infrastructure
- **Docker Compose**: Container orchestration
- **Headless Chrome**: Browser automation
- **Persistent Volumes**: SQLite and n8n data persistence

## Architecture Decisions

### Data Flow
1. **Discovery**: Job boards → CDP scraper → SQLite
2. **Scoring**: SQLite → GPT-4o-mini → Score + recommendation
3. **Generation**: Job description + master resume → GPT-4o-mini → PDF → Local storage
4. **Sync**: SQLite → Notion API → Notion databases
5. **Review**: User reviews in Next.js app (mobile)
6. **Feedback**: User actions → Applications DB → Scoring refinement

### Repository Pattern
- Abstract data access behind `JobRepository` interface
- `NotionJobRepository` implements interface
- Enables future migration to Postgres/Supabase without refactoring app logic

### Session Management
- CDP connects to existing Chrome profile (port 9222)
- Reuse authenticated sessions for Lever, Greenhouse, Workday
- Pre-run "is logged in?" checks
- Human-in-loop fallback for manual login

### Scoring Algorithm
- **Title Match (0-30)**: Exact match on priority titles = 30 pts
- **Skills (0-25)**: Keyword match from JD (Shopify, procurement, CPG) = up to 25 pts
- **Location (0-20)**: Remote = 20 pts, Charlotte 28213 = 15 pts
- **Recency (0-15)**: Posted <7 days = 15 pts, 7-14 days = 10 pts, 14-30 days = 5 pts
- **Company Fit (0-10)**: DTC/CPG company = 10 pts

### PDF Generation
- HTML templates with bundled fonts (deterministic output)
- Puppeteer renders to PDF (A4 format)
- LLM injects top 5 keywords from JD into resume/cover letter
- Files stored locally, URLs stored in Notion

### Notion Schema

#### Jobs Database
- Title (title)
- Company (text)
- Source (select): Lever, Greenhouse, Workday, Indeed, BuiltIn, Wellfound, Other
- External Job ID (text)
- URL (url)
- Location (text)
- Remote (checkbox)
- Posted At (date)
- Seniority (select): Entry, Associate, Mid, Senior, Lead, Manager, Director
- Function (multi_select): CPG Sales, Ecommerce, Procurement, Operations, Marketing, Data
- Score (number)
- Status (status): To Review, Ready, Deprioritized
- Notes (text)
- Applications (relation → Applications)
- Dedupe Hash (text)

#### Applications Database
- Title (title): Company – Role
- Job (relation → Jobs)
- Stage (status): To Review, Ready, Submitted, Blocked, Interviewing, Offer, Rejected
- Applied At (date)
- Method (select): Auto-Apply, Prepared, Manual
- Resume Variant (file)
- Cover Letter (file)
- Contact Name (text)
- Contact Email (email)
- Tracker URL (url)
- Notes (text)

## Implementation Phases

### Phase 1: Backend Foundation (Sprint 1)
1. Docker environment setup
2. CDP browser session management
3. Lever adapter with rate limiting
4. Job scoring engine
5. Notion Jobs database sync
6. PDF generation
7. Application record creation
8. End-to-end workflow orchestration

### Phase 2: Frontend MVP
1. Next.js project setup
2. Notion API integration
3. Mobile-first UI components
4. Job review interface
5. Application tracker
6. API routes

### Phase 3: Integration & Testing
1. Connect frontend to backend
2. Test complete workflows
3. Validate Notion sync
4. Performance optimization
5. Error handling and recovery

## Environment Configuration

### Backend (.env)
```bash
NOTION_API_KEY=""
NOTION_JOBS_DB_ID=""
NOTION_APPLICATIONS_DB_ID=""
OPENAI_API_KEY=""
CHROME_DEBUG_PORT=9222
CHROME_PROFILE_PATH="/path/to/chrome/profile"
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_NOTION_API_KEY=""
NEXT_PUBLIC_NOTION_JOBS_DB_ID=""
NEXT_PUBLIC_NOTION_APPLICATIONS_DB_ID=""
SENTRY_DSN=""
POSTHOG_KEY=""
```

## Deployment Strategy

### Local Development
- Docker Compose for backend services
- Next.js dev server for frontend
- SQLite for local data
- Notion for sync and tracking

### Production Considerations
- Separate n8n instances per environment
- Separate Notion workspaces (or tagged databases)
- Environment-specific API keys
- Backup strategy for SQLite and Notion

## Open Questions
- How often to run job discovery? (Daily vs hourly)
- Rate limits for job boards (need to measure)
- Lever API access vs scraping
- Multi-tenant support (future)

