/**
 * TypeScript types for Notion integration
 * Generated from Notion database schemas
 */

export interface NotionJob {
  id: string;
  title: string;
  company: string;
  source: 'Lever' | 'Greenhouse' | 'Workday' | 'Indeed' | 'BuiltIn' | 'Wellfound' | 'Other';
  externalJobId: string;
  url: string;
  location: string;
  remote: boolean;
  postedAt: string | null;
  seniority: 'Entry' | 'Associate' | 'Mid' | 'Senior' | 'Lead' | 'Manager' | 'Director' | null;
  function: string[];
  score: number;
  status: 'To Review' | 'Ready' | 'Deprioritized';
  notes: string | null;
  dedupeHash: string;
  notionPageId: string;
}

export interface NotionApplication {
  id: string;
  title: string;
  jobId: string;
  stage: 'To Review' | 'Ready' | 'Submitted' | 'Blocked' | 'Interviewing' | 'Offer' | 'Rejected';
  appliedAt: string | null;
  method: 'Auto-Apply' | 'Prepared' | 'Manual';
  resumeVariant: string | null;
  coverLetter: string | null;
  contactName: string | null;
  contactEmail: string | null;
  trackerUrl: string | null;
  notes: string | null;
  notionPageId: string;
}

export interface JobFilters {
  status?: NotionJob['status'][];
  source?: NotionJob['source'][];
  function?: string[];
  minScore?: number;
  remote?: boolean;
  search?: string;
}

export interface JobRepository {
  getJobs(filters?: JobFilters): Promise<NotionJob[]>;
  getJobById(id: string): Promise<NotionJob | null>;
  updateJobStatus(id: string, status: NotionJob['status']): Promise<void>;
  addFeedback(id: string, feedback: string): Promise<void>;
}

