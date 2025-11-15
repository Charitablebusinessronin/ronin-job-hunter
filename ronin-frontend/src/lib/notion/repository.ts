/**
 * Notion Job Repository
 * Implements JobRepository interface for Notion API
 */

import { notionClient } from './client';
import type { NotionJob, JobFilters, JobRepository } from './types';

export class NotionJobRepository implements JobRepository {
  constructor(
    private jobsDatabaseId: string,
    private client = notionClient
  ) {
    if (!jobsDatabaseId) {
      throw new Error('Jobs database ID is required');
    }
  }

  /**
   * Convert Notion page to Job object
   */
  private notionPageToJob(page: any): NotionJob {
    const props = page.properties;

    return {
      id: page.id,
      notionPageId: page.id,
      title: this.getTitle(props.Title),
      company: this.getRichText(props.Company),
      source: props.Source?.select?.name || 'Other',
      externalJobId: this.getRichText(props['External Job ID']),
      url: props.URL?.url || '',
      location: this.getRichText(props.Location),
      remote: props.Remote?.checkbox || false,
      postedAt: props['Posted At']?.date?.start || null,
      seniority: props.Seniority?.select?.name || null,
      function: props.Function?.multi_select?.map((s: any) => s.name) || [],
      score: props.Score?.number || 0,
      status: props.Status?.status?.name || 'To Review',
      notes: this.getRichText(props.Notes),
      dedupeHash: this.getRichText(props['Dedupe Hash']),
    };
  }

  private getTitle(prop: any): string {
    return prop?.title?.[0]?.plain_text || '';
  }

  private getRichText(prop: any): string {
    return prop?.rich_text?.[0]?.plain_text || '';
  }

  /**
   * Get jobs with optional filters
   */
  async getJobs(filters: JobFilters = {}): Promise<NotionJob[]> {
    try {
      const query: any = {
        database_id: this.jobsDatabaseId,
      };

      // Build filter
      const filterConditions: any[] = [];

      if (filters.status && filters.status.length > 0) {
        filterConditions.push({
          property: 'Status',
          status: {
            in: filters.status,
          },
        });
      }

      if (filters.source && filters.source.length > 0) {
        filterConditions.push({
          property: 'Source',
          select: {
            in: filters.source,
          },
        });
      }

      if (filters.minScore !== undefined) {
        filterConditions.push({
          property: 'Score',
          number: {
            greater_than_or_equal_to: filters.minScore,
          },
        });
      }

      if (filters.remote !== undefined) {
        filterConditions.push({
          property: 'Remote',
          checkbox: {
            equals: filters.remote,
          },
        });
      }

      if (filterConditions.length > 0) {
        query.filter = {
          and: filterConditions,
        };
      }

      // Add sorting
      query.sorts = [
        { property: 'Score', direction: 'descending' },
        { property: 'Posted At', direction: 'descending' },
      ];

      // @ts-ignore - Notion client types may be incomplete for databases.query
      const response = await this.client.databases.query(query);
      const jobs = response.results.map((page: any) => this.notionPageToJob(page));

      // Apply text search filter if provided
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return jobs.filter(
          (job: NotionJob) =>
            job.title.toLowerCase().includes(searchLower) ||
            job.company.toLowerCase().includes(searchLower) ||
            job.location.toLowerCase().includes(searchLower)
        );
      }

      return jobs;
    } catch (error) {
      console.error('Failed to get jobs from Notion:', error);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(id: string): Promise<NotionJob | null> {
    try {
      const response = await this.client.pages.retrieve({ page_id: id });
      return this.notionPageToJob(response);
    } catch (error) {
      console.error('Failed to get job from Notion:', error);
      return null;
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(id: string, status: NotionJob['status']): Promise<void> {
    try {
      await this.client.pages.update({
        page_id: id,
        properties: {
          Status: {
            status: {
              name: status,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to update job status:', error);
      throw error;
    }
  }

  /**
   * Add feedback/notes to job
   */
  async addFeedback(id: string, feedback: string): Promise<void> {
    try {
      // Get current notes
      const page = await this.client.pages.retrieve({ page_id: id });
      const currentNotes = (page as any).properties.Notes?.rich_text?.[0]?.plain_text || '';

      const updatedNotes = currentNotes
        ? `${currentNotes}\n\n${feedback}`
        : feedback;

      await this.client.pages.update({
        page_id: id,
        properties: {
          Notes: {
            rich_text: [
              {
                text: {
                  content: updatedNotes,
                },
              },
            ],
          },
        },
      });
    } catch (error) {
      console.error('Failed to add feedback:', error);
      throw error;
    }
  }
}

