/**
 * Notion Applications Database Sync
 * Creates application records in Notion with PDF attachments
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const Logger = require('../utils/logger');
const RateLimiter = require('../utils/rate-limiter');

class NotionApplicationsSync {
    constructor(config = {}) {
        this.notion = new Client({ auth: config.notionApiKey });
        this.databaseId = config.applicationsDatabaseId;
        this.jobsDatabaseId = config.jobsDatabaseId;
        this.rateLimiter = new RateLimiter({
            baseDelay: 1000,
            maxDelay: 5000,
            maxRetries: 3,
        });
        this.logger = new Logger('NotionApplicationsSync');
    }

    /**
     * Upload file to Notion
     * Note: Notion API requires files to be publicly accessible URLs
     * For local files, we'll need to use a file hosting service or return the path
     * @param {string} filePath - Local file path
     * @returns {Promise<string>} File URL or path
     */
    async uploadFile(filePath) {
        // For now, return the file path
        // In production, upload to Cloudflare R2, S3, or similar and return URL
        // This is a placeholder - actual implementation depends on file hosting strategy
        this.logger.warn('File upload not implemented - using local path', { filePath });
        return filePath;
    }

    /**
     * Convert application object to Notion page properties
     * @param {Object} application - Application object
     * @param {string} jobPageId - Notion page ID of the related job
     * @returns {Object} Notion page properties
     */
    applicationToNotionProperties(application, jobPageId) {
        const title = `${application.company} – ${application.role}`;

        const properties = {
            'Title': {
                title: [{ text: { content: title } }],
            },
            'Job': {
                relation: [{ id: jobPageId }],
            },
            'Stage': {
                status: { name: application.stage || 'Ready' },
            },
            'Method': {
                select: { name: application.method || 'Prepared' },
            },
        };

        // Add Applied At if provided
        if (application.applied_at) {
            properties['Applied At'] = {
                date: { start: application.applied_at },
            };
        }

        // Add PDF files if paths are provided
        if (application.resume_path) {
            // Note: Notion requires publicly accessible URLs
            // For local development, we'll store the path in Notes
            properties['Resume Variant'] = {
                files: [], // Will be populated when files are hosted
            };
        }

        if (application.cover_letter_path) {
            properties['Cover Letter'] = {
                files: [], // Will be populated when files are hosted
            };
        }

        // Add contact info if provided
        if (application.contact_name) {
            properties['Contact Name'] = {
                rich_text: [{ text: { content: application.contact_name } }],
            };
        }

        if (application.contact_email) {
            properties['Contact Email'] = {
                email: application.contact_email,
            };
        }

        if (application.tracker_url) {
            properties['Tracker URL'] = {
                url: application.tracker_url,
            };
        }

        // Add notes with file paths if files are local
        let notes = application.notes || '';
        if (application.resume_path) {
            notes += `\nResume: ${application.resume_path}`;
        }
        if (application.cover_letter_path) {
            notes += `\nCover Letter: ${application.cover_letter_path}`;
        }

        if (notes) {
            properties['Notes'] = {
                rich_text: [{ text: { content: notes.trim() } }],
            };
        }

        return properties;
    }

    /**
     * Create application page in Notion
     * @param {Object} application - Application object
     * @param {string} jobPageId - Notion page ID of the related job
     * @returns {Promise<Object>} Created page
     */
    async createApplication(application, jobPageId) {
        try {
            // Verify PDFs exist before creating application
            if (application.resume_path) {
                try {
                    await fs.access(application.resume_path);
                } catch (error) {
                    throw new Error(`Resume PDF not found: ${application.resume_path}`);
                }
            }

            if (application.cover_letter_path) {
                try {
                    await fs.access(application.cover_letter_path);
                } catch (error) {
                    throw new Error(`Cover letter PDF not found: ${application.cover_letter_path}`);
                }
            }

            const properties = this.applicationToNotionProperties(application, jobPageId);

            const response = await this.rateLimiter.execute(async () => {
                return await this.notion.pages.create({
                    parent: { database_id: this.databaseId },
                    properties,
                });
            });

            this.logger.info('Created application page in Notion', {
                applicationId: application.id,
                notionPageId: response.id,
                title: `${application.company} – ${application.role}`,
            });

            return response;
        } catch (error) {
            this.logger.error('Failed to create application page', error, {
                applicationId: application.id,
            });
            throw error;
        }
    }

    /**
     * Find job page ID by dedupe hash
     * @param {string} dedupeHash - Job dedupe hash
     * @returns {Promise<string|null>} Job page ID or null
     */
    async findJobPageId(dedupeHash) {
        try {
            const response = await this.rateLimiter.execute(async () => {
                return await this.notion.databases.query({
                    database_id: this.jobsDatabaseId,
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
            this.logger.error('Failed to find job page', error, { dedupeHash });
            throw error;
        }
    }

    /**
     * Create application for a job
     * @param {Object} job - Job object with dedupe_hash
     * @param {Object} pdfPaths - Object with resume_path and cover_letter_path
     * @returns {Promise<Object>} Created application page
     */
    async createApplicationForJob(job, pdfPaths) {
        try {
            // Find job page in Notion
            const jobPageId = await this.findJobPageId(job.dedupe_hash);

            if (!jobPageId) {
                throw new Error(`Job page not found in Notion for dedupe hash: ${job.dedupe_hash}`);
            }

            // Create application
            const application = {
                id: require('crypto').randomUUID(),
                company: job.company,
                role: job.title,
                stage: 'Ready',
                method: 'Prepared',
                resume_path: pdfPaths.resumePath,
                cover_letter_path: pdfPaths.coverLetterPath,
            };

            return await this.createApplication(application, jobPageId);
        } catch (error) {
            this.logger.error('Failed to create application for job', error, { jobId: job.id });
            throw error;
        }
    }
}

module.exports = NotionApplicationsSync;

