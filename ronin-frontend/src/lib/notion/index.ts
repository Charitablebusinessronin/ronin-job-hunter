/**
 * Notion Repository Export
 * Factory function to create repository instance
 */

import { NotionJobRepository } from './repository';
import type { JobRepository } from './types';

export function createJobRepository(): JobRepository {
  const jobsDatabaseId = process.env.NEXT_PUBLIC_NOTION_JOBS_DB_ID;

  if (!jobsDatabaseId) {
    throw new Error('NEXT_PUBLIC_NOTION_JOBS_DB_ID environment variable is required');
  }

  return new NotionJobRepository(jobsDatabaseId);
}

export { NotionJobRepository } from './repository';
export * from './types';
export * from './client';

