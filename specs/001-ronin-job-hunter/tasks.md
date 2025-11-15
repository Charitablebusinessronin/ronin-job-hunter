# Task Breakdown: Ronin Job Hunter

## Sprint 1: Backend Foundation

### Story 1.1: CDP Browser Session Management
**Priority**: P0 (Blocker)  
**Story Points**: 3  
**Dependencies**: None

**Tasks**:
1. Create Docker Compose configuration for n8n + Chrome
2. Configure CDP remote debugging port (127.0.0.1:9222)
3. Set up managed Chrome profile with existing sessions
4. Implement "is logged in?" checks for Lever, Greenhouse, Workday
5. Create n8n workflow node for CDP preflight
6. Handle human-in-loop fallback for manual login
7. Document session verification process

**Files**:
- `docker-compose.yml`
- `n8n/workflows/cdp-preflight.json`
- `scripts/check-session.sh`

**Acceptance Criteria**:
- CDP port bound to 127.0.0.1:9222 only
- Session verification runs before scraping
- Logs show session status per source
- Manual login fallback documented

---

### Story 1.2: Lever Job Discovery with Rate Limiting
**Priority**: P0  
**Story Points**: 5  
**Dependencies**: Story 1.1

**Tasks**:
1. Build Lever adapter in n8n
2. Implement exponential backoff (2s, 4s, 8s, 16s max)
3. Create circuit breaker for failures
4. Normalize Lever data to standard job schema
5. Store jobs in SQLite with dedupe hash
6. Implement dry-run mode
7. Add structured logging

**Files**:
- `n8n/workflows/lever-discovery.json`
- `backend/adapters/lever.js`
- `backend/normalizers/job-normalizer.js`
- `backend/db/schema.sql`

**Acceptance Criteria**:
- Discovers ≥10 Lever jobs in single run
- 429/403 responses trigger exponential backoff
- Circuit breaker activates after 3 consecutive failures
- All jobs have required fields
- Dry-run mode works

---

### Story 1.3: Job Scoring and Ready Threshold
**Priority**: P1  
**Story Points**: 3  
**Dependencies**: Story 1.2

**Tasks**:
1. Implement scoring rubric components
2. Calculate total score (sum of components)
3. Set Ready threshold at ≥70
4. Mark jobs as "Ready" or "To Review"
5. Log scoring decisions with breakdown
6. Make threshold configurable

**Files**:
- `backend/scoring/scoring-engine.js`
- `backend/scoring/rubric.js`
- `config/scoring.yaml`

**Acceptance Criteria**:
- Each job receives component scores
- Total score = sum of components (max 100)
- Jobs ≥70 marked as "Ready"
- Jobs <70 marked as "To Review"
- Scoring decision logged with breakdown

---

### Story 1.4: Notion Jobs Database Sync with Dedupe
**Priority**: P0  
**Story Points**: 3  
**Dependencies**: Story 1.3

**Tasks**:
1. Create Notion Jobs database (if not exists)
2. Implement dedupe hash calculation (sha256(source + external_job_id))
3. Implement upsert logic (update if exists, create if new)
4. Map all job properties to Notion schema
5. Set status based on scoring
6. Handle rate limits gracefully
7. Test for duplicate prevention

**Files**:
- `backend/notion/jobs-sync.js`
- `backend/notion/schema.js`
- `scripts/create-notion-db.js`

**Acceptance Criteria**:
- Dedupe hash prevents duplicates
- Upsert logic works correctly
- All properties mapped correctly
- Status set based on score
- Rate limits handled gracefully

---

### Story 1.5: Resume & Cover Letter PDF Generation
**Priority**: P1  
**Story Points**: 5  
**Dependencies**: Story 1.3

**Tasks**:
1. Create HTML templates for resume (CPG Sales variant)
2. Create HTML templates for cover letter
3. Implement GPT-4o-mini keyword injection
4. Use Puppeteer to render PDFs
5. Bundle fonts for deterministic output
6. Store PDFs locally in `/outputs` directory
7. Implement proper file naming

**Files**:
- `templates/resume.html`
- `templates/cover-letter.html`
- `backend/pdf/generator.js`
- `backend/ai/keyword-injector.js`

**Acceptance Criteria**:
- HTML templates exist for both resume and cover letter
- GPT-4o-mini injects JD keywords (temperature 0.2)
- Puppeteer renders PDFs with bundled fonts
- PDFs stored locally with proper naming
- Content includes JD-aligned keywords

---

### Story 1.6: Application Record Creation
**Priority**: P1  
**Story Points**: 2  
**Dependencies**: Story 1.5

**Tasks**:
1. Create Notion Applications database (if not exists)
2. Create Application page with proper title format
3. Link Application to Job via relation
4. Attach Resume Variant and Cover Letter PDFs
5. Set Stage to "Ready" and Method to "Prepared"
6. Only create if PDFs exist (no empty shells)

**Files**:
- `backend/notion/applications-sync.js`
- `scripts/create-notion-db.js`

**Acceptance Criteria**:
- Application page created in Notion
- Title format: "CompanyName – Role Title"
- Job relation linked correctly
- Both PDFs attached
- No empty Application shells

---

### Story 1.7: End-to-End Workflow Orchestration
**Priority**: P0  
**Story Points**: 3  
**Dependencies**: All previous stories

**Tasks**:
1. Create single n8n workflow with manual trigger
2. Chain all components: CDP → Lever → Scoring → Notion → PDF → Application
3. Implement structured logging
4. Add dry-run mode (config flag)
5. Create execution summary logging
6. Handle errors gracefully

**Files**:
- `n8n/workflows/main-workflow.json`
- `backend/utils/logger.js`
- `config/workflow.yaml`

**Acceptance Criteria**:
- Single-button trigger starts workflow
- Execution flow completes successfully
- Structured logs printed
- Dry-run mode works
- Execution summary shows counts and decisions
- Completes in <5 minutes for 10 jobs

---

## Sprint 2: Frontend MVP

### Story 2.1: Next.js Project Setup
**Priority**: P0  
**Story Points**: 2  
**Dependencies**: None

**Tasks**:
1. Initialize Next.js 14 project with TypeScript
2. Install and configure Tailwind CSS
3. Set up shadcn/ui
4. Install dependencies: @tanstack/react-query, @sentry/nextjs
5. Configure project structure

**Files**:
- `ronin-frontend/` (new directory)
- `ronin-frontend/package.json`
- `ronin-frontend/tailwind.config.js`
- `ronin-frontend/next.config.js`

---

### Story 2.2: Notion API Integration
**Priority**: P0  
**Story Points**: 3  
**Dependencies**: Story 2.1

**Tasks**:
1. Install @notionhq/client
2. Create JobRepository interface
3. Implement NotionJobRepository class
4. Set up TypeScript types from Notion schema
5. Handle rate limits and errors

**Files**:
- `ronin-frontend/src/lib/notion/repository.ts`
- `ronin-frontend/src/lib/notion/types.ts`
- `ronin-frontend/src/lib/notion/client.ts`

---

### Story 2.3: Mobile-First UI Components
**Priority**: P1  
**Story Points**: 5  
**Dependencies**: Story 2.2

**Tasks**:
1. Install shadcn/ui components
2. Create job card component
3. Implement swipe gestures
4. Build Kanban view
5. Create bottom navigation
6. Add pull-to-refresh

**Files**:
- `ronin-frontend/src/components/job-card.tsx`
- `ronin-frontend/src/components/kanban.tsx`
- `ronin-frontend/src/components/navigation.tsx`

---

### Story 2.4: Job Review Interface
**Priority**: P1  
**Story Points**: 5  
**Dependencies**: Story 2.3

**Tasks**:
1. Create job list view with infinite scroll
2. Implement job detail view
3. Add match score breakdown
4. Display generated PDFs preview
5. Implement quick actions (Apply, Maybe, Skip)

**Files**:
- `ronin-frontend/src/app/jobs/page.tsx`
- `ronin-frontend/src/app/jobs/[id]/page.tsx`
- `ronin-frontend/src/components/job-detail.tsx`

---

### Story 2.5: Application Tracker
**Priority**: P1  
**Story Points**: 3  
**Dependencies**: Story 2.4

**Tasks**:
1. Create table view (desktop)
2. Create card view (mobile)
3. Implement status updates
4. Add filtering and sorting

**Files**:
- `ronin-frontend/src/app/applications/page.tsx`
- `ronin-frontend/src/components/application-tracker.tsx`

---

### Story 2.6: API Routes
**Priority**: P0  
**Story Points**: 3  
**Dependencies**: Story 2.2

**Tasks**:
1. Create GET /api/jobs endpoint
2. Create GET /api/jobs/[id] endpoint
3. Create PATCH /api/jobs/[id] endpoint
4. Create GET /api/applications endpoint
5. Create GET /api/resume/[jobId] endpoint
6. Implement error handling

**Files**:
- `ronin-frontend/src/app/api/jobs/route.ts`
- `ronin-frontend/src/app/api/jobs/[id]/route.ts`
- `ronin-frontend/src/app/api/applications/route.ts`
- `ronin-frontend/src/app/api/resume/[jobId]/route.ts`

---

## Task Dependencies Graph

```
Story 1.1 (CDP Session)
  └─> Story 1.2 (Lever Discovery)
      └─> Story 1.3 (Scoring)
          ├─> Story 1.4 (Notion Sync)
          └─> Story 1.5 (PDF Generation)
              └─> Story 1.6 (Application Creation)
                  └─> Story 1.7 (Workflow)

Story 2.1 (Next.js Setup)
  └─> Story 2.2 (Notion API)
      ├─> Story 2.3 (UI Components)
      │   └─> Story 2.4 (Job Review)
      │       └─> Story 2.5 (Application Tracker)
      └─> Story 2.6 (API Routes)
```

## Parallel Execution Opportunities

- Story 1.4 and Story 1.5 can run in parallel (both depend on Story 1.3)
- Story 2.3 and Story 2.6 can run in parallel (both depend on Story 2.2)
- Frontend stories (Sprint 2) can start after Story 1.4 completes

