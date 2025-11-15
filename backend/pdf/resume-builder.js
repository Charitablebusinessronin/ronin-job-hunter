/**
 * Resume Builder
 * Orchestrates resume and cover letter generation with AI and PDF creation
 */

const KeywordInjector = require('../ai/keyword-injector');
const PDFGenerator = require('./generator');
const Logger = require('../utils/logger');
const DatabaseManager = require('../db/database');
const NotionProfileFetcher = require('../notion/profile-fetcher');

class ResumeBuilder {
    constructor(config = {}) {
        this.keywordInjector = new KeywordInjector({
            openaiApiKey: config.openaiApiKey,
        });
        this.pdfGenerator = new PDFGenerator({
            debugPort: config.debugPort,
            outputDir: config.outputDir,
        });
        this.db = config.db || new DatabaseManager(config.dbPath);
        this.masterResume = config.masterResume || {};
        this.logger = new Logger('ResumeBuilder');
        
        // Initialize profile fetcher if Notion config provided
        if (config.notionApiKey && config.profileDatabaseId) {
            this.profileFetcher = new NotionProfileFetcher({
                notionApiKey: config.notionApiKey,
                profileDatabaseId: config.profileDatabaseId,
            });
        } else {
            this.profileFetcher = null;
        }
        
        // Cache for profile data
        this._profileDataCache = null;
    }

    /**
     * Load master resume from Notion profile database
     * @returns {Promise<Object>} Master resume data
     */
    async loadMasterResumeFromNotion() {
        if (this._profileDataCache) {
            return this._profileDataCache;
        }

        if (!this.profileFetcher) {
            this.logger.warn('Profile fetcher not configured, using empty master resume');
            return {};
        }

        try {
            this.logger.info('Loading master resume from Notion profile database');
            const resumeData = await this.profileFetcher.getResumeData();
            this._profileDataCache = resumeData;
            this.logger.info('Master resume loaded from Notion', {
                workExperience: resumeData.workExperience?.length || 0,
                skills: resumeData.skills?.length || 0,
            });
            return resumeData;
        } catch (error) {
            this.logger.error('Failed to load master resume from Notion', error);
            // Return empty object as fallback
            return {};
        }
    }

    /**
     * Get master resume (from config or Notion)
     * @returns {Promise<Object>} Master resume data
     */
    async getMasterResume() {
        // If masterResume is already provided in config, use it
        if (this.masterResume && Object.keys(this.masterResume).length > 0) {
            return this.masterResume;
        }

        // Otherwise, try to load from Notion
        return await this.loadMasterResumeFromNotion();
    }

    /**
     * Build resume and cover letter for a job
     * @param {Object} job - Job object from database
     * @returns {Promise<Object>} Paths to generated PDFs
     */
    async buildForJob(job) {
        this.logger.info('Building resume and cover letter for job', {
            jobId: job.id,
            title: job.title,
            company: job.company,
        });

        try {
            // Get master resume (from config or Notion)
            const masterResume = await this.getMasterResume();
            
            // Extract keywords from job description
            const keywords = await this.keywordInjector.extractKeywords(job.description, 5);
            this.logger.info('Keywords extracted', { keywords });

            // Tailor resume with keywords
            const tailoredResume = await this.keywordInjector.tailorResume(
                JSON.stringify(masterResume),
                keywords,
                job.description
            );

            // Parse tailored resume (assuming it returns JSON string)
            let resumeData;
            try {
                resumeData = JSON.parse(tailoredResume);
            } catch (e) {
                // If not JSON, use master resume as fallback
                resumeData = masterResume;
            }

            // Generate cover letter
            const coverLetterContent = await this.keywordInjector.generateCoverLetter(
                job,
                JSON.stringify(masterResume),
                keywords
            );

            // Generate PDFs
            const resumePath = await this.pdfGenerator.generateResume(job, resumeData);
            const coverLetterPath = await this.pdfGenerator.generateCoverLetter(
                job,
                coverLetterContent,
                { name: resumeData.name || 'Your Name' }
            );

            this.logger.info('Resume and cover letter generated', {
                resumePath,
                coverLetterPath,
            });

            return {
                resumePath,
                coverLetterPath,
                keywords,
            };

        } catch (error) {
            this.logger.error('Failed to build resume/cover letter', error, { jobId: job.id });
            throw error;
        }
    }

    /**
     * Build for multiple jobs
     * @param {Array<Object>} jobs - Array of job objects
     * @returns {Promise<Array<Object>>} Array of results
     */
    async buildForJobs(jobs) {
        const results = [];

        for (const job of jobs) {
            try {
                const result = await this.buildForJob(job);
                results.push({
                    jobId: job.id,
                    success: true,
                    ...result,
                });
            } catch (error) {
                results.push({
                    jobId: job.id,
                    success: false,
                    error: error.message,
                });
            }
        }

        return results;
    }
}

module.exports = ResumeBuilder;

