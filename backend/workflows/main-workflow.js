#!/usr/bin/env node
/**
 * Main Workflow Orchestrator
 * End-to-end workflow: CDP → Lever → Scoring → Notion → PDF → Application
 */

require('dotenv').config();
const { CDPSessionManager, JOB_BOARD_SELECTORS } = require('../utils/cdp-session');
const LeverAdapter = require('../adapters/lever');
const ScoringEngine = require('../scoring/scoring-engine');
const DatabaseManager = require('../db/database');
const NotionJobsSync = require('../notion/jobs-sync');
const ResumeBuilder = require('../pdf/resume-builder');
const NotionApplicationsSync = require('../notion/applications-sync');
const Logger = require('../utils/logger');
const NotionProfileFetcher = require('../notion/profile-fetcher');

class MainWorkflow {
    constructor(config = {}) {
        this.config = {
            dryRun: config.dryRun || process.env.DRY_RUN === 'true',
            debugPort: config.debugPort || process.env.CHROME_DEBUG_PORT || 9222,
            dbPath: config.dbPath || './sqlite/jobs.db',
            outputDir: config.outputDir || './outputs',
            ...config,
        };

        this.logger = new Logger('MainWorkflow');
        this.db = new DatabaseManager(this.config.dbPath);
        this.cdpManager = new CDPSessionManager({ debugPort: this.config.debugPort });
        this.leverAdapter = new LeverAdapter();
        this.scoringEngine = new ScoringEngine({ readyThreshold: 70 });
        this.notionJobsSync = new NotionJobsSync({
            notionApiKey: process.env.NOTION_API_KEY,
            jobsDatabaseId: process.env.NOTION_JOBS_DB_ID,
        });
        // Initialize profile fetcher if configured
        let masterResume = config.masterResume;
        if (!masterResume && process.env.NOTION_API_KEY && process.env.NOTION_PROFILE_DB_ID) {
            // Profile will be loaded lazily by ResumeBuilder
            this.logger.info('Notion profile database configured, will load resume data from Notion');
        }

        this.resumeBuilder = new ResumeBuilder({
            openaiApiKey: process.env.OPENAI_API_KEY,
            debugPort: this.config.debugPort,
            outputDir: this.config.outputDir,
            db: this.db,
            masterResume: masterResume || {},
            notionApiKey: process.env.NOTION_API_KEY,
            profileDatabaseId: process.env.NOTION_PROFILE_DB_ID,
        });
        this.applicationsSync = new NotionApplicationsSync({
            notionApiKey: process.env.NOTION_API_KEY,
            applicationsDatabaseId: process.env.NOTION_APPLICATIONS_DB_ID,
            jobsDatabaseId: process.env.NOTION_JOBS_DB_ID,
        });
    }

    /**
     * Run complete workflow
     * @returns {Promise<Object>} Execution summary
     */
    async run() {
        const startTime = Date.now();
        const summary = {
            startedAt: new Date().toISOString(),
            dryRun: this.config.dryRun,
            jobsDiscovered: 0,
            jobsScored: 0,
            jobsReady: 0,
            jobsSynced: 0,
            pdfsGenerated: 0,
            applicationsCreated: 0,
            errors: [],
        };

        this.logger.info('Starting main workflow', { dryRun: this.config.dryRun });

        try {
            // Step 1: CDP Preflight
            this.logger.info('Step 1: CDP Preflight');
            await this.cdpManager.connect();
            const loginStatus = await this.cdpManager.checkAllJobBoards([
                { name: 'Lever', ...JOB_BOARD_SELECTORS.lever },
            ]);
            
            if (!loginStatus.Lever) {
                throw new Error('Not logged into Lever. Please log in and run again.');
            }
            this.logger.info('✓ CDP preflight complete');

            // Step 2: Job Discovery
            this.logger.info('Step 2: Job Discovery');
            const searchCriteria = {
                keywords: ['ecommerce', 'shopify', 'procurement', 'cpg', 'sales'],
                location: 'Charlotte, NC',
                remote: true,
            };
            const discoveredJobs = await this.leverAdapter.discover(searchCriteria);
            summary.jobsDiscovered = discoveredJobs.length;
            this.logger.info(`✓ Discovered ${discoveredJobs.length} jobs`);

            // Step 3: Store in SQLite
            this.logger.info('Step 3: Storing jobs in SQLite');
            for (const job of discoveredJobs) {
                try {
                    this.db.upsertJob(job);
                } catch (error) {
                    this.logger.warn('Failed to store job', { jobId: job.id, error: error.message });
                }
            }

            // Step 4: Scoring
            this.logger.info('Step 4: Scoring jobs');
            const scoredJobs = this.scoringEngine.scoreJobs(discoveredJobs);
            summary.jobsScored = scoredJobs.length;
            
            const readyJobs = scoredJobs.filter(j => j.status === 'Ready');
            summary.jobsReady = readyJobs.length;
            this.logger.info(`✓ Scored ${scoredJobs.length} jobs, ${readyJobs.length} ready`);

            // Update scores in database
            for (const job of scoredJobs) {
                const scoreComponents = JSON.parse(job.score_components || '{}');
                this.db.updateJobScore(
                    job.dedupe_hash,
                    job.score,
                    scoreComponents,
                    job.status
                );
            }

            // Step 5: Notion Sync (Jobs)
            this.logger.info('Step 5: Syncing jobs to Notion');
            if (!this.config.dryRun) {
                const syncResults = await this.notionJobsSync.syncJobs(scoredJobs);
                summary.jobsSynced = syncResults.created + syncResults.updated;
                this.logger.info(`✓ Synced ${summary.jobsSynced} jobs to Notion`);
            } else {
                this.logger.info('⏭️  Skipping Notion sync (dry-run mode)');
            }

            // Step 6: PDF Generation (only for Ready jobs)
            this.logger.info('Step 6: Generating PDFs for Ready jobs');
            if (!this.config.dryRun && readyJobs.length > 0) {
                for (const job of readyJobs) {
                    try {
                        const pdfResult = await this.resumeBuilder.buildForJob(job);
                        summary.pdfsGenerated++;
                        this.logger.info(`✓ Generated PDFs for job ${job.id}`);

                        // Step 7: Create Application
                        this.logger.info('Step 7: Creating application record');
                        await this.applicationsSync.createApplicationForJob(job, {
                            resumePath: pdfResult.resumePath,
                            coverLetterPath: pdfResult.coverLetterPath,
                        });
                        summary.applicationsCreated++;
                        this.logger.info(`✓ Created application for job ${job.id}`);

                    } catch (error) {
                        summary.errors.push({
                            jobId: job.id,
                            step: 'PDF/Application',
                            error: error.message,
                        });
                        this.logger.error('Failed to generate PDFs/create application', error, { jobId: job.id });
                    }
                }
            } else {
                this.logger.info(`⏭️  Skipping PDF generation (dry-run: ${this.config.dryRun}, ready jobs: ${readyJobs.length})`);
            }

            // Final summary
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            summary.completedAt = new Date().toISOString();
            summary.duration = `${duration}s`;
            summary.success = summary.errors.length === 0;

            this.logger.info('Workflow complete', summary);
            console.log('\n' + '='.repeat(60));
            console.log('WORKFLOW EXECUTION SUMMARY');
            console.log('='.repeat(60));
            console.log(`Duration: ${summary.duration}`);
            console.log(`Jobs Discovered: ${summary.jobsDiscovered}`);
            console.log(`Jobs Scored: ${summary.jobsScored}`);
            console.log(`Jobs Ready (≥70): ${summary.jobsReady}`);
            console.log(`Jobs Synced to Notion: ${summary.jobsSynced}`);
            console.log(`PDFs Generated: ${summary.pdfsGenerated}`);
            console.log(`Applications Created: ${summary.applicationsCreated}`);
            if (summary.errors.length > 0) {
                console.log(`Errors: ${summary.errors.length}`);
                summary.errors.forEach(err => {
                    console.log(`  - ${err.jobId}: ${err.error}`);
                });
            }
            console.log('='.repeat(60));

            return summary;

        } catch (error) {
            summary.errors.push({
                step: 'Workflow',
                error: error.message,
            });
            this.logger.error('Workflow failed', error);
            throw error;
        }
    }
}

// CLI execution
if (require.main === module) {
    const config = {
        dryRun: process.argv.includes('--dry-run'),
    };

    const workflow = new MainWorkflow(config);
    workflow.run()
        .then(summary => {
            process.exit(summary.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Workflow execution failed:', error);
            process.exit(1);
        });
}

module.exports = MainWorkflow;

