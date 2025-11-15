-- SQLite schema for Ronin Job Hunter
-- This is the source of truth; Notion is the sync target

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    external_job_id TEXT NOT NULL,
    dedupe_hash TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    url TEXT NOT NULL,
    location TEXT,
    remote INTEGER DEFAULT 0,
    posted_at TEXT,
    seniority TEXT,
    function_tags TEXT, -- JSON array
    description TEXT,
    score INTEGER DEFAULT 0,
    score_components TEXT, -- JSON object
    status TEXT DEFAULT 'To Review',
    notion_page_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, external_job_id)
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    notion_page_id TEXT,
    stage TEXT DEFAULT 'To Review',
    applied_at TEXT,
    method TEXT DEFAULT 'Prepared',
    resume_path TEXT,
    cover_letter_path TEXT,
    contact_name TEXT,
    contact_email TEXT,
    tracker_url TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS workflow_runs (
    id TEXT PRIMARY KEY,
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    status TEXT DEFAULT 'running',
    jobs_discovered INTEGER DEFAULT 0,
    jobs_scored INTEGER DEFAULT 0,
    jobs_ready INTEGER DEFAULT 0,
    pdfs_generated INTEGER DEFAULT 0,
    applications_created INTEGER DEFAULT 0,
    errors TEXT, -- JSON array
    summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_dedupe_hash ON jobs(dedupe_hash);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(score);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(stage);

