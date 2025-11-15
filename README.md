# Ronin Job Hunter

An automated job discovery and application system that discovers jobs, scores them, generates tailored resumes/cover letters, and tracks applications in Notion.

## 🎯 Overview

Ronin Job Hunter is a personal job-hunting assistant that:
- **Discovers** jobs from Lever, Greenhouse, Workday, and other sources
- **Scores** jobs based on fit (0-100 scale)
- **Generates** tailored resumes and cover letters using GPT-4o-mini
- **Tracks** applications in Notion with full visibility
- **Reviews** jobs via a mobile-first web interface

## 🏗️ Architecture

### Backend (n8n Orchestration)
- **n8n**: Workflow automation platform (Docker)
- **Chrome DevTools Protocol (CDP)**: Browser automation for job board access
- **SQLite**: Local data storage with migrations
- **Notion API**: Sync target for Jobs and Applications databases
- **OpenAI GPT-4o-mini**: AI for keyword extraction and content tailoring (temperature 0.2)
- **Puppeteer**: PDF generation from HTML templates

### Frontend (Next.js 14)
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **TanStack Query**: Data fetching and caching

## 📋 Prerequisites

- **Docker** and **Docker Compose** (for backend services)
- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for spec-kit, optional)
- **Chrome/Chromium** with authenticated sessions for job boards
- **API Keys**:
  - Notion API key
  - OpenAI API key

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Resume
```

### 2. Environment Configuration

**Option A: Automatic Setup (Recommended)**

If your Notion API key is already configured, run:

```bash
export NOTION_API_KEY="your_notion_api_key"
cd backend && npm install
node ../scripts/setup-env-from-notion.js
```

This script will automatically:
- Find your Jobs and Applications databases in Notion
- Configure all `.env` files with the correct database IDs
- Set up frontend environment variables

**Option B: Manual Setup**

Create a `.env` file in the project root:

```bash
# Notion Configuration
NOTION_API_KEY="your_notion_api_key"
NOTION_JOBS_DB_ID="your_jobs_database_id"
NOTION_APPLICATIONS_DB_ID="your_applications_database_id"
NOTION_PROFILE_DB_ID="your_profile_database_id"  # Optional: For personal profile integration

# OpenAI Configuration
OPENAI_API_KEY="your_openai_api_key"

# Chrome Configuration
CHROME_DEBUG_PORT=9222
CHROME_PROFILE_PATH="/path/to/chrome/profile"

# n8n Configuration
N8N_PASSWORD="your_secure_password"
CHROME_TOKEN="optional_chrome_token"
```

**Getting Database IDs from Notion:**
- Open your database in Notion
- Copy the URL (e.g., `https://www.notion.so/abc123def456...`)
- The database ID is the part after the last `/` (remove any `?v=...` query params)

**Profile Database (Optional):**
The system can automatically load your personal profile from Notion's "📝 Sabir's Professional Profile" database for resume generation. To set this up:

```bash
# Get the profile database ID automatically
node scripts/get-profile-db-id.js

# Or manually add to .env:
NOTION_PROFILE_DB_ID="your_profile_database_id"
```

The profile database should have entries with:
- **Type**: Work Experience, Education, Skill, Project, Certification, Achievement, Personal
- **Include in Resume**: Checkbox to filter which entries to use
- **Display Order**: Number to control ordering
- **Skills Used**: Multi-select tags for skills
- **Time Period**: Date range for work/education entries

### 3. Start Backend Services

```bash
docker-compose up -d
```

This starts:
- **n8n** on `http://localhost:5678`
- **Chrome (browserless)** on `http://localhost:9222`

### 4. Initialize Notion Databases

Run the database creation script:

```bash
cd backend
npm install
node scripts/create-notion-db.js
```

This creates:
- **Jobs Database**: Stores discovered jobs with scoring and metadata
- **Applications Database**: Tracks application status and PDFs

### 5. Configure Job Search Criteria

Edit `config/search-criteria.yaml`:

```yaml
locations:
  - Charlotte, NC 28213 (within 25 miles)
  - Remote (US-wide)

role_focus:
  - E-commerce Manager
  - Procurement
  - CPG Sales
  - Sales (COBs)

keywords_include:
  - ecommerce
  - Shopify
  - marketplace
  - procurement
  - sourcing
  - CPG
  - DTC
  - sales
  - channel
  - distribution

keywords_exclude:
  - unpaid
  - internship
  - volunteer
  - campus

hard_filters:
  - exclude_non_manager_internships: true
  - exclude_below_mid_level: true
  - preferred_cpg_dtc: true
```

### 6. Run Job Discovery Workflow

1. Open n8n UI: `http://localhost:5678`
2. Import workflow from `n8n/workflows/main-workflow.json`
3. Configure workflow with your search criteria
4. Trigger workflow manually or set up schedule

### 7. Start Frontend (Optional)

```bash
cd ronin-frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📁 Project Structure

```
Resume/
├── backend/                 # Backend utilities and adapters
│   ├── adapters/           # Job board adapters (Lever, Greenhouse, etc.)
│   ├── ai/                 # AI utilities (keyword injection)
│   ├── db/                 # SQLite database schema and migrations
│   ├── notion/             # Notion API integration
│   ├── pdf/                # PDF generation utilities
│   ├── scoring/            # Job scoring engine
│   └── utils/              # Shared utilities
├── config/                 # Configuration files
│   ├── search-criteria.yaml
│   ├── scoring.yaml
│   └── workflow.yaml
├── docker-compose.yml      # Docker services configuration
├── memory/                 # Spec-kit memory (constitution, principles)
├── n8n/                    # n8n workflows
│   └── workflows/
├── outputs/                # Generated PDFs (resumes, cover letters)
├── scripts/                # Utility scripts
├── specs/                  # Spec-kit specifications
│   └── 001-ronin-job-hunter/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
├── sqlite/                 # SQLite database files
└── templates/              # HTML templates for PDFs
    ├── resume.html
    └── cover-letter.html
```

## 🔧 Configuration

### Job Scoring Rubric

Jobs are scored on a 0-100 scale:

- **Title Match** (0-30 points): Exact match on priority titles
- **Skills Match** (0-25 points): Keyword match from job description
- **Location/Remote** (0-20 points): Remote = 20 pts, Charlotte = 15 pts
- **Recency** (0-15 points): Posted <7 days = 15 pts, 7-14 days = 10 pts, 14-30 days = 5 pts
- **Company Fit** (0-10 points): DTC/CPG company = 10 pts

**Ready Threshold**: Jobs scoring ≥70 are marked as "Ready" for application.

### Rate Limiting

- **Exponential Backoff**: 2s, 4s, 8s, 16s max
- **Circuit Breaker**: Activates after 3 consecutive failures
- **Notion API**: 3 requests/second limit

## 📊 Workflow

1. **Discovery**: Job boards → CDP scraper → SQLite
2. **Scoring**: SQLite → GPT-4o-mini → Score + recommendation
3. **Generation**: Job description + master resume → GPT-4o-mini → PDF → Local storage
4. **Sync**: SQLite → Notion API → Notion databases
5. **Review**: User reviews in Next.js app (mobile)
6. **Feedback**: User actions → Applications DB → Scoring refinement

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

Tests cover:
- CDP session management
- Lever adapter discovery
- Scoring algorithm
- Notion sync (no duplicates)
- PDF generation

### Frontend Testing

```bash
cd ronin-frontend
npm test
```

### End-to-End Testing

1. Run complete workflow: discovery → scoring → sync → PDF → application
2. Verify all components work together
3. Test error handling and recovery
4. Validate logging and monitoring

## 📝 Development Workflow

### Using Spec-Kit

This project uses [spec-kit](https://github.com/github/spec-kit) for specification-driven development:

1. **Specifications**: `specs/001-ronin-job-hunter/spec.md`
2. **Implementation Plan**: `specs/001-ronin-job-hunter/plan.md`
3. **Task Breakdown**: `specs/001-ronin-job-hunter/tasks.md`
4. **Constitution**: `memory/constitution.md`

### Task Management

Tasks are tracked in:
- **Archon**: Primary task tracking system
- **Notion**: Mirrored tasks in "My tasks" database

Workflow: `todo` → `doing` → `review` → `complete`

## 🐛 Troubleshooting

### Chrome CDP Connection Issues

```bash
# Check if Chrome is running on port 9222
curl http://localhost:9222/json/version

# Verify Chrome profile path
ls -la $CHROME_PROFILE_PATH
```

### n8n Workflow Errors

1. Check n8n logs: `docker-compose logs n8n`
2. Verify environment variables are set
3. Check Chrome service is running: `docker-compose ps`

### Notion Sync Issues

1. Verify API key has access to databases
2. Check database IDs are correct
3. Review rate limit errors in logs
4. Ensure dedupe hash is working (check for duplicates)

### PDF Generation Failures

1. Verify Puppeteer can connect to Chrome
2. Check HTML templates exist in `templates/`
3. Verify fonts are bundled correctly
4. Check disk space in `outputs/` directory

## 🔒 Security

- **Credentials**: Stored in `.env` files only (never in code or Notion)
- **Docker Secrets**: Use for production deployments
- **Rate Limiting**: Respects site ToS and rate limits
- **No Aggressive Scraping**: Backoff and scheduling required
- **Human-in-Loop**: Fallback for CAPTCHA/2FA

## 📚 Documentation

- **Specification**: `specs/001-ronin-job-hunter/spec.md`
- **Implementation Plan**: `specs/001-ronin-job-hunter/plan.md`
- **Task Breakdown**: `specs/001-ronin-job-hunter/tasks.md`
- **Constitution**: `memory/constitution.md`
- **Notion Docs**: See Resume App Documentation database

## 🚢 Deployment

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

## 📄 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📞 Support

[Add support information here]

