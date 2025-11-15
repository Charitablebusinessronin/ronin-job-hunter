/**
 * Job Scoring Engine
 * Scores jobs based on title, skills, location, recency, and company fit
 */

const RUBRIC = require('./rubric');
const Logger = require('../utils/logger');

class ScoringEngine {
    constructor(config = {}) {
        this.readyThreshold = config.readyThreshold || 70;
        this.logger = new Logger('ScoringEngine');
    }

    /**
     * Calculate title match score
     * @param {string} title - Job title
     * @returns {number} Score (0-30)
     */
    scoreTitle(title) {
        if (!title) return 0;

        const titleLower = title.toLowerCase();

        // Check for exact match on priority titles
        for (const priorityTitle of RUBRIC.title.priorityTitles) {
            if (titleLower === priorityTitle.toLowerCase()) {
                return RUBRIC.title.exactMatch;
            }
        }

        // Check for partial match
        for (const priorityTitle of RUBRIC.title.priorityTitles) {
            const keywords = priorityTitle.toLowerCase().split(' ');
            const matchCount = keywords.filter(kw => titleLower.includes(kw)).length;
            
            if (matchCount >= 2) {
                return RUBRIC.title.partialMatch;
            }
        }

        return 0;
    }

    /**
     * Calculate skills match score
     * @param {string} description - Job description
     * @returns {number} Score (0-25)
     */
    scoreSkills(description) {
        if (!description) return 0;

        const descLower = description.toLowerCase();
        let score = 0;

        for (const keyword of RUBRIC.skills.keywords) {
            if (descLower.includes(keyword)) {
                score += RUBRIC.skills.pointsPerMatch;
            }
        }

        return Math.min(score, RUBRIC.skills.max);
    }

    /**
     * Calculate location score
     * @param {string} location - Job location
     * @param {number} remote - Remote flag (0 or 1)
     * @returns {number} Score (0-20)
     */
    scoreLocation(location, remote) {
        if (remote === 1) {
            return RUBRIC.location.remote;
        }

        if (!location) return 0;

        const locationLower = location.toLowerCase();

        // Check for Charlotte area
        if (locationLower.includes('charlotte') || locationLower.includes(RUBRIC.location.charlotteZip)) {
            return RUBRIC.location.charlotte;
        }

        // Check for zip codes near Charlotte (28213 area)
        const zipMatch = locationLower.match(/\b282\d{2}\b/);
        if (zipMatch) {
            // Close zip codes get partial score
            return 10;
        }

        return 0;
    }

    /**
     * Calculate recency score
     * @param {string} postedAt - ISO date string
     * @returns {number} Score (0-15)
     */
    scoreRecency(postedAt) {
        if (!postedAt) return 0;

        const postedDate = new Date(postedAt);
        const now = new Date();
        const daysDiff = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));

        if (daysDiff < 7) {
            return RUBRIC.recency.days7;
        } else if (daysDiff < 14) {
            return RUBRIC.recency.days14;
        } else if (daysDiff < 30) {
            return RUBRIC.recency.days30;
        }

        return 0;
    }

    /**
     * Calculate company fit score
     * @param {string} company - Company name
     * @param {string} description - Job description
     * @returns {number} Score (0-10)
     */
    scoreCompanyFit(company, description) {
        if (!company && !description) return 0;

        const text = `${company} ${description}`.toLowerCase();

        // Check for CPG keywords
        const hasCPG = RUBRIC.companyFit.cpgKeywords.some(keyword => text.includes(keyword));
        const hasDTC = RUBRIC.companyFit.dtcKeywords.some(keyword => text.includes(keyword));

        if (hasCPG || hasDTC) {
            return RUBRIC.companyFit.points;
        }

        return 0;
    }

    /**
     * Score a job
     * @param {Object} job - Job object
     * @returns {Object} Scoring result with total score, components, and status
     */
    score(job) {
        const components = {
            title: this.scoreTitle(job.title),
            skills: this.scoreSkills(job.description),
            location: this.scoreLocation(job.location, job.remote),
            recency: this.scoreRecency(job.posted_at),
            companyFit: this.scoreCompanyFit(job.company, job.description),
        };

        const total = Object.values(components).reduce((sum, score) => sum + score, 0);
        const status = total >= this.readyThreshold ? 'Ready' : 'To Review';

        const result = {
            total,
            components,
            status,
            ready: total >= this.readyThreshold,
        };

        this.logger.debug('Job scored', {
            jobId: job.id,
            title: job.title,
            ...result,
        });

        return result;
    }

    /**
     * Score multiple jobs
     * @param {Array<Object>} jobs - Array of job objects
     * @returns {Array<Object>} Array of jobs with scores
     */
    scoreJobs(jobs) {
        return jobs.map(job => {
            const scoring = this.score(job);
            return {
                ...job,
                score: scoring.total,
                score_components: JSON.stringify(scoring.components),
                status: scoring.status,
            };
        });
    }
}

module.exports = ScoringEngine;

