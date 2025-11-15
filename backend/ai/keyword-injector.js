/**
 * Keyword Injector using OpenAI GPT-4o-mini
 * Extracts keywords from job descriptions and injects them into resume/cover letter
 */

const OpenAI = require('openai');
const Logger = require('../utils/logger');

class KeywordInjector {
    constructor(config = {}) {
        this.openai = new OpenAI({ apiKey: config.openaiApiKey });
        this.model = config.model || 'gpt-4o-mini';
        this.temperature = config.temperature || 0.2;
        this.logger = new Logger('KeywordInjector');
    }

    /**
     * Extract top keywords from job description
     * @param {string} jobDescription - Full job description text
     * @param {number} count - Number of keywords to extract (default: 5)
     * @returns {Promise<Array<string>>} Array of keywords
     */
    async extractKeywords(jobDescription, count = 5) {
        try {
            const prompt = `Extract the top ${count} most important keywords or phrases from this job description that should be highlighted in a resume or cover letter. Focus on:
- Technical skills (e.g., "Shopify", "CPG", "procurement")
- Industry terms (e.g., "consumer packaged goods", "direct to consumer")
- Key responsibilities or qualifications
- Tools or platforms mentioned

Job Description:
${jobDescription}

Return only a JSON array of keywords, no other text. Example: ["Shopify", "CPG Sales", "Key Account Management", "E-commerce", "Procurement"]`;

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a resume optimization expert. Extract only the most relevant keywords.' },
                    { role: 'user', content: prompt },
                ],
                temperature: this.temperature,
                response_format: { type: 'json_object' },
            });

            const content = JSON.parse(response.choices[0].message.content);
            const keywords = content.keywords || content;

            this.logger.info('Extracted keywords', { count: keywords.length, keywords });
            return Array.isArray(keywords) ? keywords : [keywords];

        } catch (error) {
            this.logger.error('Failed to extract keywords', error);
            // Fallback: return empty array
            return [];
        }
    }

    /**
     * Tailor resume content with keywords
     * @param {string} resumeContent - Original resume content
     * @param {Array<string>} keywords - Keywords to inject
     * @param {string} jobDescription - Job description for context
     * @returns {Promise<string>} Tailored resume content
     */
    async tailorResume(resumeContent, keywords, jobDescription) {
        try {
            const prompt = `You are tailoring a resume for a specific job. Inject the following keywords naturally into the resume content while maintaining authenticity and truthfulness.

Keywords to emphasize: ${keywords.join(', ')}

Job Description Context:
${jobDescription.substring(0, 1000)}...

Original Resume Content:
${resumeContent}

Instructions:
1. Naturally incorporate the keywords into existing bullet points
2. Emphasize relevant skills and experiences
3. Maintain the original structure and format
4. Do not add false information
5. Keep the tone professional

Return the tailored resume content.`;

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a professional resume writer. Tailor resumes to match job descriptions while maintaining honesty.' },
                    { role: 'user', content: prompt },
                ],
                temperature: this.temperature,
            });

            const tailoredContent = response.choices[0].message.content;
            this.logger.info('Resume tailored successfully');
            return tailoredContent;

        } catch (error) {
            this.logger.error('Failed to tailor resume', error);
            // Fallback: return original content
            return resumeContent;
        }
    }

    /**
     * Generate cover letter content
     * @param {Object} job - Job object
     * @param {string} masterResume - Master resume content for context
     * @param {Array<string>} keywords - Extracted keywords
     * @returns {Promise<string>} Generated cover letter
     */
    async generateCoverLetter(job, masterResume, keywords) {
        try {
            const prompt = `Write a professional cover letter for this job application. Use the provided resume context and naturally incorporate the keywords.

Job Title: ${job.title}
Company: ${job.company}
Job Description:
${job.description.substring(0, 1500)}...

Keywords to incorporate: ${keywords.join(', ')}

Resume Context (for reference):
${masterResume.substring(0, 1000)}...

Instructions:
1. Start with a strong hook that mentions quantified achievements
2. Tie JD keywords to relevant experience from the resume
3. Include 2-3 proof points with numbers/metrics
4. Close with availability and call to action
5. Keep it to 3-4 paragraphs
6. Professional but authentic tone

Return only the cover letter content, no subject line or headers.`;

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a professional cover letter writer. Write compelling, authentic cover letters that match job requirements.' },
                    { role: 'user', content: prompt },
                ],
                temperature: this.temperature,
            });

            const coverLetter = response.choices[0].message.content;
            this.logger.info('Cover letter generated successfully');
            return coverLetter;

        } catch (error) {
            this.logger.error('Failed to generate cover letter', error);
            throw error;
        }
    }
}

module.exports = KeywordInjector;

