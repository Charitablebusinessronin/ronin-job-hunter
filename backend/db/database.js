/**
 * SQLite Database Manager
 * Handles database operations for jobs and applications
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor(dbPath = './sqlite/jobs.db') {
        // Ensure directory exists
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
        
        // Initialize schema
        this.initializeSchema();
    }

    /**
     * Initialize database schema
     */
    initializeSchema() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema
        this.db.exec(schema);
    }

    /**
     * Upsert a job (insert or update)
     * @param {Object} job - Normalized job object
     * @returns {Object} Upserted job
     */
    upsertJob(job) {
        const stmt = this.db.prepare(`
            INSERT INTO jobs (
                id, source, external_job_id, dedupe_hash, title, company, url,
                location, remote, posted_at, seniority, function_tags, description,
                score, score_components, status, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
            )
            ON CONFLICT(dedupe_hash) DO UPDATE SET
                title = excluded.title,
                company = excluded.company,
                url = excluded.url,
                location = excluded.location,
                remote = excluded.remote,
                posted_at = excluded.posted_at,
                seniority = excluded.seniority,
                function_tags = excluded.function_tags,
                description = excluded.description,
                updated_at = CURRENT_TIMESTAMP
        `);

        stmt.run(
            job.id,
            job.source,
            job.external_job_id,
            job.dedupe_hash,
            job.title,
            job.company,
            job.url,
            job.location,
            job.remote,
            job.posted_at,
            job.seniority,
            job.function_tags,
            job.description,
            job.score,
            job.score_components,
            job.status
        );

        return this.getJobByDedupeHash(job.dedupe_hash);
    }

    /**
     * Get job by dedupe hash
     * @param {string} dedupeHash
     * @returns {Object|null}
     */
    getJobByDedupeHash(dedupeHash) {
        const stmt = this.db.prepare('SELECT * FROM jobs WHERE dedupe_hash = ?');
        return stmt.get(dedupeHash) || null;
    }

    /**
     * Get jobs by status
     * @param {string} status
     * @returns {Array}
     */
    getJobsByStatus(status) {
        const stmt = this.db.prepare('SELECT * FROM jobs WHERE status = ? ORDER BY score DESC, posted_at DESC');
        return stmt.all(status);
    }

    /**
     * Update job score
     * @param {string} dedupeHash
     * @param {number} score
     * @param {Object} scoreComponents
     * @param {string} status
     */
    updateJobScore(dedupeHash, score, scoreComponents, status) {
        const stmt = this.db.prepare(`
            UPDATE jobs
            SET score = ?, score_components = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE dedupe_hash = ?
        `);

        stmt.run(score, JSON.stringify(scoreComponents), status, dedupeHash);
    }

    /**
     * Create application record
     * @param {Object} application
     * @returns {Object}
     */
    createApplication(application) {
        const stmt = this.db.prepare(`
            INSERT INTO applications (
                id, job_id, stage, applied_at, method, resume_path, cover_letter_path,
                contact_name, contact_email, tracker_url, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const id = application.id || require('crypto').randomUUID();
        
        stmt.run(
            id,
            application.job_id,
            application.stage || 'To Review',
            application.applied_at,
            application.method || 'Prepared',
            application.resume_path,
            application.cover_letter_path,
            application.contact_name,
            application.contact_email,
            application.tracker_url,
            application.notes
        );

        return this.getApplication(id);
    }

    /**
     * Get application by ID
     * @param {string} id
     * @returns {Object|null}
     */
    getApplication(id) {
        const stmt = this.db.prepare('SELECT * FROM applications WHERE id = ?');
        return stmt.get(id) || null;
    }

    /**
     * Close database connection
     */
    close() {
        this.db.close();
    }
}

module.exports = DatabaseManager;

