# Specification: Ronin Job Hunter

## Overview
Build a local, Dockerized personal job-hunting assistant that finds roles by criteria, generates tailored resumes and cover letters from your profile/templates, and applies or prepares applications while tracking everything in Notion.

## Core Features

### 1. Job Discovery
- **Sources**: Lever, Greenhouse, Workday, Indeed, BuiltIn, Wellfound
- **Input**: Role categories, keywords, min pay, location list, remote-only flag
- **Processing**: Parse job descriptions, score fit, filter by criteria
- **Output**: Job records with metadata (title, company, location, posted date, etc.)

### 2. Job Scoring Engine
- **Scoring Components**:
  - Title match: 0-30 points
  - Skills match: 0-25 points
  - Location/Remote: 0-20 points
  - Recency: 0-15 points
  - Company fit: 0-10 points
- **Total Score**: 0-100
- **Ready Threshold**: ≥70 marks job as "Ready" for application
- **Status**: Jobs <70 marked as "To Review"

### 3. Resume & Cover Letter Generation
- **Input**: Job description, master resume content (from Notion), user writing samples
- **Process**: GPT-4o-mini tailors resume to job requirements (temperature 0.2)
- **Output**: HTML templates rendered to PDF via Puppeteer
- **Storage**: PDFs stored locally in `/outputs` directory
- **Naming**: `Resume_CompanyName_Role.pdf` and `CoverLetter_CompanyName_Role.pdf`

### 4. Notion Integration
- **Jobs Database**: Sync discovered jobs with dedupe hash (sha256(source + external_job_id))
- **Applications Database**: Track application status, attach PDFs, link to Jobs
- **Sync Strategy**: One-way sync (SQLite → Notion), batch updates every 5 minutes
- **Rate Limits**: Handle gracefully with exponential backoff

### 5. Mobile-First Review Interface
- **Kanban Views**: New Jobs, To Apply, Applied, Interviewing, Archived
- **Job Cards**: Display match score, key match reasons, missing qualifications
- **Swipe Gestures**: Swipe right → "To Apply", Swipe left → "Archive"
- **Detail View**: Full job description, score breakdown, generated PDFs preview
- **Application Tracker**: Table/card view with status updates

## Search Criteria

### Locations
- Charlotte, NC 28213 (within 25 miles)
- Remote (US-wide)

### Role Focus
- E-commerce Manager
- Procurement
- CPG Sales
- Sales (COBs)

### Keywords to Include
- ecommerce, Shopify, marketplace, procurement, sourcing, CPG, DTC, sales, channel, distribution

### Keywords to Avoid
- unpaid, internship, volunteer, campus

### Hard Filters
- Exclude non-manager internships
- Exclude roles below mid-level
- Preferred: CPG and DTC e-commerce operators

## Technical Requirements

### Backend
- **Orchestration**: n8n (Docker)
- **Browser Automation**: Chrome DevTools Protocol (CDP)
- **Data Storage**: SQLite (local) + Notion API (sync)
- **AI**: OpenAI GPT-4o-mini
- **PDF Generation**: Puppeteer
- **Session Management**: Reuse authenticated Chrome profile

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: URL state + React Query cache

### Authentication & Security
- CDP handles all login sessions via browser cookies
- Credentials stored in .env only (never in Notion or code)
- Google Password Manager for credential autofill
- Human-in-loop fallback for CAPTCHA/2FA

## Acceptance Criteria

1. Given a config, system finds at least 20 relevant roles and scores them
2. For a chosen role, generates a resume and cover letter with JD-aligned keywords
3. Creates application record with status transitions: To Review → Ready → Submitted / Blocked
4. Handles remote-only mode and location include lists
5. Respects site ToS and rate limits
6. Persists state and logs locally
7. Syncs to Notion without creating duplicates

## Constraints

- Personal use, no aggressive scraping
- Backoff and scheduling required
- Some portals require manual steps (record and resume later)
- Must run locally in Docker
- Config-driven search criteria (YAML/JSON)

