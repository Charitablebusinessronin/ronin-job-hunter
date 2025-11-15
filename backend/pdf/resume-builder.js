/**
 * Resume Builder
 * Orchestrates resume and cover letter generation with AI and PDF creation
 */

const KeywordInjector = require('../ai/keyword-injector');
const PDFGenerator = require('./generator');
const Logger = require('../utils/logger');
const DatabaseManager = require('../db/database');

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
            // Extract keywords from job description
            const keywords = await this.keywordInjector.extractKeywords(job.description, 5);
            this.logger.info('Keywords extracted', { keywords });

            // Tailor resume with keywords
            const tailoredResume = await this.keywordInjector.tailorResume(
                JSON.stringify(this.masterResume),
                keywords,
                job.description
            );

            // Parse tailored resume (assuming it returns JSON string)
            let resumeData;
            try {
                resumeData = JSON.parse(tailoredResume);
            } catch (e) {
                // If not JSON, use master resume as fallback
                resumeData = this.masterResume;
            }

            // Generate cover letter
            const coverLetterContent = await this.keywordInjector.generateCoverLetter(
                job,
                JSON.stringify(this.masterResume),
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

