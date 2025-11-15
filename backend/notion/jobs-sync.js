/**
 * Notion Jobs Database Sync
 * Syncs jobs from SQLite to Notion with dedupe hash upsert logic
 */

const { Client } = require('@notionhq/client');
const Logger = require('../utils/logger');
const RateLimiter = require('../utils/rate-limiter');

class NotionJobsSync {
    constructor(config = {}) {
        this.notion = new Client({ auth: config.notionApiKey });
        this.databaseId = config.jobsDatabaseId;
        this.rateLimiter = new RateLimiter({
            baseDelay: 1000, // 1 second base delay for Notion (3 req/sec limit)
            maxDelay: 5000,
            maxRetries: 3,
        });
        this.logger = new Logger('NotionJobsSync');
        this.batchSize = 10; // Process in batches to respect rate limits
    }

    /**
     * Convert job object to Notion page properties
     * @param {Object} job - Job object from database
     * @returns {Object} Notion page properties
     */
    jobToNotionProperties(job) {
        const functionTags = JSON.parse(job.function_tags || '[]');

        return {
            'Title': {
                title: [{ text: { content: job.title } }],
            },
            'Company': {
                rich_text: [{ text: { content: job.company || '' } }],
            },
            'Source': {
                select: { name: job.source || 'Other' },
            },
            'External Job ID': {
                rich_text: [{ text: { content: job.external_job_id || '' } }],
            },
            'URL': {
                url: job.url || null,
            },
            'Location': {
                rich_text: [{ text: { content: job.location || '' } }],
            },
            'Remote': {
                checkbox: job.remote === 1,
            },
            'Posted At': {
                date: job.posted_at ? { start: job.posted_at } : null,
            },
            'Seniority': {
                select: job.seniority ? { name: job.seniority } : null,
            },
            'Function': {
                multi_select: functionTags.map(tag => ({ name: tag })),
            },
            'Score': {
                number: job.score || 0,
            },
            'Status': {
                status: { name: job.status || 'To Review' },
            },
            'Dedupe Hash': {
                rich_text: [{ text: { content: job.dedupe_hash } }],
            },
        };
    }

    /**
     * Find existing Notion page by dedupe hash
     * @param {string} dedupeHash
     * @returns {Promise<string|null>} Page ID or null
     */
    async findPageByDedupeHash(dedupeHash) {
        try {
            const response = await this.rateLimiter.execute(async () => {
                return await this.notion.databases.query({
                    database_id: this.databaseId,
                    filter: {
                        property: 'Dedupe Hash',
                        rich_text: {
                            equals: dedupeHash,
                        },
                    },
                });
            });

            if (response.results.length > 0) {
                return response.results[0].id;
            }

            return null;
        } catch (error) {
            this.logger.error('Failed to find page by dedupe hash', error, { dedupeHash });
            throw error;
        }
    }

    /**
     * Create a new job page in Notion
     * @param {Object} job - Job object
     * @returns {Promise<Object>} Created page
     */
    async createJobPage(job) {
        try {
            const properties = this.jobToNotionProperties(job);

            const response = await this.rateLimiter.execute(async () => {
                return await this.notion.pages.create({
                    parent: { database_id: this.databaseId },
                    properties,
                });
            });

            this.logger.info('Created job page in Notion', {
                jobId: job.id,
                notionPageId: response.id,
                title: job.title,
            });

            return response;
        } catch (error) {
            this.logger.error('Failed to create job page', error, { jobId: job.id });
            throw error;
        }
    }

    /**
     * Update an existing job page in Notion
     * @param {string} pageId - Notion page ID
     * @param {Object} job - Job object
     * @returns {Promise<Object>} Updated page
     */
    async updateJobPage(pageId, job) {
        try {
            const properties = this.jobToNotionProperties(job);

            const response = await this.rateLimiter.execute(async () => {
                return await this.notion.pages.update({
                    page_id: pageId,
                    properties,
                });
            });

            this.logger.info('Updated job page in Notion', {
                jobId: job.id,
                notionPageId: pageId,
                title: job.title,
            });

            return response;
        } catch (error) {
            this.logger.error('Failed to update job page', error, { jobId: job.id, pageId });
            throw error;
        }
    }

    /**
     * Upsert a job (create or update)
     * @param {Object} job - Job object
     * @returns {Promise<Object>} Notion page
     */
    async upsertJob(job) {
        try {
            // Find existing page by dedupe hash
            const existingPageId = await this.findPageByDedupeHash(job.dedupe_hash);

            if (existingPageId) {
                // Update existing page
                return await this.updateJobPage(existingPageId, job);
            } else {
                // Create new page
                return await this.createJobPage(job);
            }
        } catch (error) {
            this.logger.error('Failed to upsert job', error, { jobId: job.id });
            throw error;
        }
    }

    /**
     * Sync multiple jobs in batches
     * @param {Array<Object>} jobs - Array of job objects
     * @returns {Promise<Object>} Sync results
     */
    async syncJobs(jobs) {
        const results = {
            created: 0,
            updated: 0,
            errors: 0,
            pages: [],
        };

        this.logger.info(`Starting sync of ${jobs.length} jobs to Notion`);

        // Process in batches to respect rate limits
        for (let i = 0; i < jobs.length; i += this.batchSize) {
            const batch = jobs.slice(i, i + this.batchSize);
            this.logger.info(`Processing batch ${Math.floor(i / this.batchSize) + 1} (${batch.length} jobs)`);

            for (const job of batch) {
                try {
                    const page = await this.upsertJob(job);
                    results.pages.push(page.id);

                    // Determine if created or updated
                    const existingPageId = await this.findPageByDedupeHash(job.dedupe_hash);
                    if (existingPageId) {
                        results.updated++;
                    } else {
                        results.created++;
                    }

                    // Small delay between requests to respect rate limits
                    await new Promise(resolve => setTimeout(resolve, 350)); // ~3 req/sec
                } catch (error) {
                    results.errors++;
                    this.logger.error('Failed to sync job', error, { jobId: job.id });
                }
            }

            // Longer delay between batches
            if (i + this.batchSize < jobs.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        this.logger.info('Sync complete', results);
        return results;
    }
}

module.exports = NotionJobsSync;

