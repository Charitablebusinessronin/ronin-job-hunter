/**
 * Notion Profile Fetcher
 * Fetches personal profile data from Notion "📝 Sabir's Professional Profile" database
 * and transforms it into a structured resume format
 */

const { Client } = require('@notionhq/client');
const Logger = require('../utils/logger');
const RateLimiter = require('../utils/rate-limiter');

class NotionProfileFetcher {
    constructor(config = {}) {
        this.notion = new Client({ auth: config.notionApiKey });
        this.databaseId = config.profileDatabaseId;
        this.rateLimiter = new RateLimiter({
            baseDelay: 1000,
            maxDelay: 5000,
            maxRetries: 3,
        });
        this.logger = new Logger('NotionProfileFetcher');
    }

    /**
     * Fetch all profile entries from Notion
     * @returns {Promise<Array>} Array of profile entries
     */
    async fetchProfileData() {
        try {
            this.logger.info('Fetching profile data from Notion', { databaseId: this.databaseId });

            const response = await this.rateLimiter.execute(() =>
                this.notion.databases.query({
                    database_id: this.databaseId,
                    filter: {
                        property: 'Include in Resume',
                        checkbox: {
                            equals: true,
                        },
                    },
                    sorts: [
                        {
                            property: 'Display Order',
                            direction: 'ascending',
                        },
                    ],
                })
            );

            const entries = response.results.map(page => this.notionPageToProfileEntry(page));
            this.logger.info('Profile data fetched', { count: entries.length });
            return entries;
        } catch (error) {
            this.logger.error('Failed to fetch profile data', error);
            throw error;
        }
    }

    /**
     * Convert Notion page to profile entry
     * @param {Object} page - Notion page object
     * @returns {Object} Profile entry
     */
    notionPageToProfileEntry(page) {
        const props = page.properties;

        // Extract date range
        let timePeriod = null;
        if (props['Time Period']?.date) {
            timePeriod = {
                start: props['Time Period'].date.start,
                end: props['Time Period'].date.end || null,
            };
        }

        // Extract skills
        const skills = props['Skills Used']?.multi_select?.map(s => s.name) || [];

        return {
            section: this.extractTitle(props['Section']),
            type: props['Type']?.select?.name || null,
            category: props['Category']?.rich_text?.[0]?.plain_text || null,
            roleTitle: props['Role/Title']?.rich_text?.[0]?.plain_text || null,
            organization: props['Organization']?.rich_text?.[0]?.plain_text || null,
            details: props['Details']?.rich_text?.[0]?.plain_text || null,
            timePeriod,
            skills,
            displayOrder: props['Display Order']?.number || 0,
            includeInResume: props['Include in Resume']?.checkbox || false,
        };
    }

    /**
     * Extract title from Notion title property
     * @param {Object} titleProp - Notion title property
     * @returns {string} Title text
     */
    extractTitle(titleProp) {
        if (!titleProp?.title) return '';
        return titleProp.title.map(t => t.plain_text).join('');
    }

    /**
     * Transform profile entries into structured resume format
     * @param {Array} entries - Profile entries from Notion
     * @returns {Object} Structured resume data
     */
    transformToResumeFormat(entries) {
        const resume = {
            name: 'Sabir Asheed', // Default name, can be overridden
            contact: {},
            summary: '',
            workExperience: [],
            education: [],
            skills: [],
            projects: [],
            certifications: [],
            achievements: [],
        };

        // Group entries by type
        const byType = {
            'Work Experience': [],
            'Education': [],
            'Skill': [],
            'Project': [],
            'Certification': [],
            'Achievement': [],
            'Personal': [],
        };

        entries.forEach(entry => {
            const type = entry.type;
            if (byType[type]) {
                byType[type].push(entry);
            }
        });

        // Transform work experience
        resume.workExperience = byType['Work Experience']
            .sort((a, b) => {
                // Sort by time period (most recent first)
                if (!a.timePeriod || !b.timePeriod) return 0;
                return new Date(b.timePeriod.start) - new Date(a.timePeriod.start);
            })
            .map(entry => ({
                title: entry.roleTitle || '',
                company: entry.organization || '',
                location: entry.category || '',
                startDate: entry.timePeriod?.start || '',
                endDate: entry.timePeriod?.end || 'Present',
                description: entry.details || '',
                skills: entry.skills || [],
            }));

        // Transform education
        resume.education = byType['Education']
            .sort((a, b) => {
                if (!a.timePeriod || !b.timePeriod) return 0;
                return new Date(b.timePeriod.start) - new Date(a.timePeriod.start);
            })
            .map(entry => ({
                degree: entry.roleTitle || '',
                institution: entry.organization || '',
                location: entry.category || '',
                startDate: entry.timePeriod?.start || '',
                endDate: entry.timePeriod?.end || '',
                description: entry.details || '',
            }));

        // Transform skills
        const skillEntries = byType['Skill'];
        const allSkills = new Set();
        skillEntries.forEach(entry => {
            if (entry.skills && entry.skills.length > 0) {
                entry.skills.forEach(skill => allSkills.add(skill));
            }
            if (entry.details) {
                // If details contains skill names, extract them
                const skillList = entry.details.split(',').map(s => s.trim());
                skillList.forEach(skill => allSkills.add(skill));
            }
        });
        resume.skills = Array.from(allSkills).sort();

        // Transform projects
        resume.projects = byType['Project']
            .sort((a, b) => b.displayOrder - a.displayOrder)
            .map(entry => ({
                name: entry.roleTitle || entry.section || '',
                organization: entry.organization || '',
                description: entry.details || '',
                skills: entry.skills || [],
                timePeriod: entry.timePeriod,
            }));

        // Transform certifications
        resume.certifications = byType['Certification']
            .sort((a, b) => {
                if (!a.timePeriod || !b.timePeriod) return 0;
                return new Date(b.timePeriod.start) - new Date(a.timePeriod.start);
            })
            .map(entry => ({
                name: entry.roleTitle || entry.section || '',
                issuer: entry.organization || '',
                date: entry.timePeriod?.start || '',
                description: entry.details || '',
            }));

        // Transform achievements
        resume.achievements = byType['Achievement']
            .sort((a, b) => b.displayOrder - a.displayOrder)
            .map(entry => ({
                title: entry.roleTitle || entry.section || '',
                organization: entry.organization || '',
                description: entry.details || '',
                date: entry.timePeriod?.start || '',
            }));

        // Extract personal info (contact, summary)
        const personalEntries = byType['Personal'];
        personalEntries.forEach(entry => {
            const section = entry.section?.toLowerCase() || '';
            if (section.includes('email') || section.includes('contact')) {
                resume.contact.email = entry.details || '';
            } else if (section.includes('phone')) {
                resume.contact.phone = entry.details || '';
            } else if (section.includes('linkedin')) {
                resume.contact.linkedin = entry.details || '';
            } else if (section.includes('summary') || section.includes('profile')) {
                resume.summary = entry.details || '';
            }
        });

        return resume;
    }

    /**
     * Fetch and transform profile data into resume format
     * @returns {Promise<Object>} Structured resume data
     */
    async getResumeData() {
        const entries = await this.fetchProfileData();
        return this.transformToResumeFormat(entries);
    }
}

module.exports = NotionProfileFetcher;

