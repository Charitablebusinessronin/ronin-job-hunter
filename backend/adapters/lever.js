/**
 * Lever Job Board Adapter
 * Discovers jobs from Lever API/website with rate limiting
 */

const axios = require('axios');
const RateLimiter = require('../utils/rate-limiter');
const JobNormalizer = require('../normalizers/job-normalizer');
const Logger = require('../utils/logger');

class LeverAdapter {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'https://api.lever.co/v0';
        this.rateLimiter = new RateLimiter({
            baseDelay: 2000,
            maxDelay: 16000,
            maxRetries: 3,
        });
        this.normalizer = new JobNormalizer();
        this.logger = new Logger('LeverAdapter');
    }

    /**
     * Search for jobs using Lever API
     * @param {Object} searchParams - Search parameters
     * @returns {Promise<Array>} Array of normalized job objects
     */
    async searchJobs(searchParams = {}) {
        const {
            team = '',
            location = '',
            commitment = '',
            limit = 100,
        } = searchParams;

        const params = new URLSearchParams();
        if (team) params.append('team', team);
        if (location) params.append('location', location);
        if (commitment) params.append('commitment', commitment);
        params.append('limit', limit);

        const url = `${this.baseUrl}/postings?${params.toString()}`;

        this.logger.info('Searching Lever jobs', { url, params: Object.fromEntries(params) });

        try {
            const response = await this.rateLimiter.execute(async () => {
                return await axios.get(url, {
                    headers: {
                        'Accept': 'application/json',
                    },
                    timeout: 30000,
                });
            });

            const jobs = response.data || [];
            this.logger.info(`Found ${jobs.length} jobs from Lever`);

            // Normalize jobs
            const normalizedJobs = jobs.map(job => {
                try {
                    return this.normalizer.normalizeLeverJob(job);
                } catch (error) {
                    this.logger.warn('Failed to normalize job', { jobId: job.id, error: error.message });
                    return null;
                }
            }).filter(job => job !== null);

            this.logger.info(`Normalized ${normalizedJobs.length} jobs`);
            return normalizedJobs;

        } catch (error) {
            this.logger.error('Failed to search Lever jobs', error, { url });
            throw error;
        }
    }

    /**
     * Get job details by ID
     * @param {string} jobId - Lever job ID
     * @returns {Promise<Object>} Normalized job object
     */
    async getJobDetails(jobId) {
        const url = `${this.baseUrl}/postings/${jobId}`;

        this.logger.debug('Fetching job details', { jobId, url });

        try {
            const response = await this.rateLimiter.execute(async () => {
                return await axios.get(url, {
                    headers: {
                        'Accept': 'application/json',
                    },
                    timeout: 30000,
                });
            });

            return this.normalizer.normalizeLeverJob(response.data);

        } catch (error) {
            this.logger.error('Failed to get job details', error, { jobId });
            throw error;
        }
    }

    /**
     * Discover jobs with search criteria
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>} Array of normalized job objects
     */
    async discover(criteria = {}) {
        const {
            keywords = [],
            location = 'Charlotte, NC',
            remote = true,
            team = '',
        } = criteria;

        this.logger.info('Starting job discovery', { criteria });

        // Build search params
        const searchParams = {
            limit: 100,
        };

        if (team) {
            searchParams.team = team;
        }

        if (location) {
            searchParams.location = location;
        }

        if (remote) {
            searchParams.commitment = 'Full-time'; // Lever uses commitment for remote
        }

        // Search for jobs
        let allJobs = [];
        try {
            allJobs = await this.searchJobs(searchParams);
        } catch (error) {
            this.logger.error('Job discovery failed', error);
            throw error;
        }

        // Filter by keywords if provided
        if (keywords.length > 0) {
            const keywordLower = keywords.map(k => k.toLowerCase());
            allJobs = allJobs.filter(job => {
                const searchText = `${job.title} ${job.description}`.toLowerCase();
                return keywordLower.some(keyword => searchText.includes(keyword));
            });
            this.logger.info(`Filtered to ${allJobs.length} jobs matching keywords`, { keywords });
        }

        this.logger.info('Job discovery complete', {
            totalJobs: allJobs.length,
        });

        return allJobs;
    }
}

module.exports = LeverAdapter;

