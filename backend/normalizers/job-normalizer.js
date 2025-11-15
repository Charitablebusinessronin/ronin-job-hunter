/**
 * Job Normalizer
 * Normalizes job data from different sources to a standard schema
 */

const crypto = require('crypto');

class JobNormalizer {
    /**
     * Generate dedupe hash
     * @param {string} source - Job source (e.g., 'lever')
     * @param {string} externalJobId - External job ID
     * @returns {string} SHA256 hash
     */
    generateDedupeHash(source, externalJobId) {
        const data = `${source}:${externalJobId}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Infer seniority from job title
     * @param {string} title - Job title
     * @returns {string} Seniority level
     */
    inferSeniority(title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('director') || titleLower.includes('vp') || titleLower.includes('vice president')) {
            return 'Director';
        }
        if (titleLower.includes('manager') || titleLower.includes('lead')) {
            return 'Manager';
        }
        if (titleLower.includes('senior')) {
            return 'Senior';
        }
        if (titleLower.includes('associate') || titleLower.includes('junior')) {
            return 'Associate';
        }
        if (titleLower.includes('intern') || titleLower.includes('internship')) {
            return 'Entry';
        }
        
        return 'Mid'; // Default
    }

    /**
     * Infer function tags from job title and description
     * @param {string} title - Job title
     * @param {string} description - Job description
     * @returns {Array<string>} Function tags
     */
    inferFunctionTags(title, description = '') {
        const text = `${title} ${description}`.toLowerCase();
        const tags = [];

        if (text.includes('cpg') || text.includes('consumer packaged goods') || text.includes('sales')) {
            tags.push('CPG Sales');
        }
        if (text.includes('ecommerce') || text.includes('e-commerce') || text.includes('shopify')) {
            tags.push('Ecommerce');
        }
        if (text.includes('procurement') || text.includes('sourcing') || text.includes('vendor')) {
            tags.push('Procurement');
        }
        if (text.includes('operations') || text.includes('ops')) {
            tags.push('Operations');
        }
        if (text.includes('marketing')) {
            tags.push('Marketing');
        }
        if (text.includes('data') || text.includes('analytics')) {
            tags.push('Data');
        }

        return tags.length > 0 ? tags : ['Other'];
    }

    /**
     * Normalize Lever job data
     * @param {Object} leverJob - Raw Lever job data
     * @returns {Object} Normalized job object
     */
    normalizeLeverJob(leverJob) {
        const externalJobId = leverJob.id || leverJob.leverId || '';
        const source = 'lever';
        const dedupeHash = this.generateDedupeHash(source, externalJobId);

        return {
            id: dedupeHash.substring(0, 16), // Use first 16 chars of hash as ID
            source,
            external_job_id: externalJobId,
            dedupe_hash: dedupeHash,
            title: leverJob.text || leverJob.title || '',
            company: leverJob.categories?.team || leverJob.company || '',
            url: leverJob.hostedUrl || leverJob.applyUrl || '',
            location: leverJob.categories?.location || '',
            remote: (leverJob.categories?.location || '').toLowerCase().includes('remote') ? 1 : 0,
            posted_at: leverJob.createdAt || new Date().toISOString(),
            seniority: this.inferSeniority(leverJob.text || leverJob.title || ''),
            function_tags: JSON.stringify(this.inferFunctionTags(
                leverJob.text || leverJob.title || '',
                leverJob.descriptionPlain || leverJob.description || ''
            )),
            description: leverJob.descriptionPlain || leverJob.description || '',
            score: 0,
            score_components: JSON.stringify({}),
            status: 'To Review',
        };
    }

    /**
     * Normalize job from any source
     * @param {Object} rawJob - Raw job data
     * @param {string} source - Source name
     * @returns {Object} Normalized job object
     */
    normalize(rawJob, source) {
        switch (source.toLowerCase()) {
            case 'lever':
                return this.normalizeLeverJob(rawJob);
            case 'greenhouse':
                // TODO: Implement Greenhouse normalizer
                throw new Error('Greenhouse normalizer not yet implemented');
            case 'workday':
                // TODO: Implement Workday normalizer
                throw new Error('Workday normalizer not yet implemented');
            default:
                throw new Error(`Unknown source: ${source}`);
        }
    }
}

module.exports = JobNormalizer;

