/**
 * PDF Generator using Puppeteer
 * Renders HTML templates to PDF with bundled fonts
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/logger');
const { CDPSessionManager } = require('../utils/cdp-session');

class PDFGenerator {
    constructor(config = {}) {
        this.debugPort = config.debugPort || 9222;
        this.outputDir = config.outputDir || './outputs';
        this.cdpManager = new CDPSessionManager({ debugPort: this.debugPort });
        this.logger = new Logger('PDFGenerator');
    }

    /**
     * Ensure output directory exists
     */
    async ensureOutputDir() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            this.logger.error('Failed to create output directory', error);
            throw error;
        }
    }

    /**
     * Load HTML template and replace placeholders
     * @param {string} templatePath - Path to HTML template
     * @param {Object} data - Data to inject into template
     * @returns {Promise<string>} Rendered HTML
     */
    async renderTemplate(templatePath, data) {
        try {
            let html = await fs.readFile(templatePath, 'utf8');

            // Simple template replacement (can be enhanced with Mustache/Handlebars)
            for (const [key, value] of Object.entries(data)) {
                const placeholder = new RegExp(`{{${key}}}`, 'g');
                
                if (typeof value === 'object' && value !== null) {
                    // Handle arrays and objects (simple implementation)
                    if (Array.isArray(value)) {
                        // For arrays, replace with joined string
                        html = html.replace(placeholder, value.join(', '));
                    } else {
                        // For objects, stringify
                        html = html.replace(placeholder, JSON.stringify(value));
                    }
                } else {
                    html = html.replace(placeholder, value || '');
                }
            }

            return html;
        } catch (error) {
            this.logger.error('Failed to render template', error, { templatePath });
            throw error;
        }
    }

    /**
     * Generate PDF from HTML
     * @param {string} html - HTML content
     * @param {string} outputPath - Output file path
     * @returns {Promise<string>} Path to generated PDF
     */
    async generatePDF(html, outputPath) {
        let browser = null;
        let page = null;

        try {
            // Connect to existing Chrome via CDP
            browser = await this.cdpManager.connect();
            page = await browser.newPage();

            // Set content
            await page.setContent(html, {
                waitUntil: 'networkidle0',
            });

            // Generate PDF
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0.75in',
                    right: '0.75in',
                    bottom: '0.75in',
                    left: '0.75in',
                },
            });

            this.logger.info('PDF generated', { outputPath });
            return outputPath;

        } catch (error) {
            this.logger.error('Failed to generate PDF', error, { outputPath });
            throw error;
        } finally {
            if (page) {
                await page.close();
            }
            // Don't close browser - it's managed externally
        }
    }

    /**
     * Generate resume PDF
     * @param {Object} job - Job object
     * @param {Object} resumeData - Resume data (name, experience, skills, etc.)
     * @returns {Promise<string>} Path to generated PDF
     */
    async generateResume(job, resumeData) {
        await this.ensureOutputDir();

        const templatePath = path.join(__dirname, '../../templates/resume.html');
        const fileName = `Resume_${job.company.replace(/[^a-zA-Z0-9]/g, '_')}_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const outputPath = path.join(this.outputDir, fileName);

        // Prepare template data
        const templateData = {
            NAME: resumeData.name || 'Your Name',
            HEADLINE: resumeData.headline || 'CPG Sales and Ecommerce Manager — DTC, Retail, Distribution',
            EMAIL: resumeData.email || '',
            PHONE: resumeData.phone || '',
            LOCATION: resumeData.location || '',
            LINKEDIN: resumeData.linkedin || '',
            SUMMARY: resumeData.summary || '',
            SKILLS: resumeData.skills || [],
            EXPERIENCE: resumeData.experience || [],
            EDUCATION: resumeData.education || [],
            CERTIFICATIONS: resumeData.certifications || [],
        };

        // Render template
        const html = await this.renderTemplate(templatePath, templateData);

        // Generate PDF
        return await this.generatePDF(html, outputPath);
    }

    /**
     * Generate cover letter PDF
     * @param {Object} job - Job object
     * @param {string} coverLetterContent - Cover letter text
     * @param {Object} personalData - Personal information
     * @returns {Promise<string>} Path to generated PDF
     */
    async generateCoverLetter(job, coverLetterContent, personalData = {}) {
        await this.ensureOutputDir();

        const templatePath = path.join(__dirname, '../../templates/cover-letter.html');
        const fileName = `CoverLetter_${job.company.replace(/[^a-zA-Z0-9]/g, '_')}_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const outputPath = path.join(this.outputDir, fileName);

        // Split cover letter into paragraphs
        const paragraphs = coverLetterContent.split('\n\n').filter(p => p.trim());

        // Prepare template data
        const templateData = {
            DATE: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            CONTACT_NAME: job.contact_name || '',
            COMPANY: job.company,
            COMPANY_ADDRESS: '',
            PARAGRAPH_1: paragraphs[0] || '',
            PARAGRAPH_2: paragraphs[1] || '',
            PARAGRAPH_3: paragraphs[2] || paragraphs.slice(2).join('\n\n') || '',
            NAME: personalData.name || 'Your Name',
        };

        // Render template
        const html = await this.renderTemplate(templatePath, templateData);

        // Generate PDF
        return await this.generatePDF(html, outputPath);
    }
}

module.exports = PDFGenerator;

