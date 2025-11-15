/**
 * Structured logging utility for workflow execution
 */

class Logger {
    constructor(context = '') {
        this.context = context;
        this.logs = [];
    }

    _formatMessage(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            context: this.context,
            message,
            ...data,
        };
    }

    info(message, data = {}) {
        const log = this._formatMessage('INFO', message, data);
        this.logs.push(log);
        console.log(`[${log.timestamp}] [INFO] ${this.context}: ${message}`, data);
        return log;
    }

    error(message, error = null, data = {}) {
        const log = this._formatMessage('ERROR', message, {
            ...data,
            error: error ? {
                message: error.message,
                stack: error.stack,
            } : null,
        });
        this.logs.push(log);
        console.error(`[${log.timestamp}] [ERROR] ${this.context}: ${message}`, error, data);
        return log;
    }

    warn(message, data = {}) {
        const log = this._formatMessage('WARN', message, data);
        this.logs.push(log);
        console.warn(`[${log.timestamp}] [WARN] ${this.context}: ${message}`, data);
        return log;
    }

    debug(message, data = {}) {
        const log = this._formatMessage('DEBUG', message, data);
        this.logs.push(log);
        console.debug(`[${log.timestamp}] [DEBUG] ${this.context}: ${message}`, data);
        return log;
    }

    getLogs() {
        return this.logs;
    }

    getSummary() {
        const errors = this.logs.filter(l => l.level === 'ERROR');
        const warnings = this.logs.filter(l => l.level === 'WARN');
        const infos = this.logs.filter(l => l.level === 'INFO');

        return {
            total: this.logs.length,
            errors: errors.length,
            warnings: warnings.length,
            infos: infos.length,
            logs: this.logs,
        };
    }
}

module.exports = Logger;

