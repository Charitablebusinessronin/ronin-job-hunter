/**
 * Rate Limiter with Exponential Backoff
 * Handles 429/403 responses with exponential backoff and circuit breaker
 */

class RateLimiter {
    constructor(options = {}) {
        this.baseDelay = options.baseDelay || 2000; // 2 seconds
        this.maxDelay = options.maxDelay || 16000; // 16 seconds
        this.maxRetries = options.maxRetries || 3;
        this.circuitBreakerThreshold = options.circuitBreakerThreshold || 3;
        this.circuitBreakerTimeout = options.circuitBreakerTimeout || 60000; // 1 minute
        
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.circuitOpen = false;
    }

    /**
     * Calculate exponential backoff delay
     * @param {number} attempt - Current attempt number (0-indexed)
     * @returns {number} Delay in milliseconds
     */
    calculateDelay(attempt) {
        const delay = Math.min(
            this.baseDelay * Math.pow(2, attempt),
            this.maxDelay
        );
        return delay;
    }

    /**
     * Check if circuit breaker should allow request
     * @returns {boolean}
     */
    isCircuitOpen() {
        if (!this.circuitOpen) {
            return false;
        }

        // Check if timeout has passed
        const timeSinceFailure = Date.now() - this.lastFailureTime;
        if (timeSinceFailure > this.circuitBreakerTimeout) {
            this.circuitOpen = false;
            this.failureCount = 0;
            return false;
        }

        return true;
    }

    /**
     * Record a failure
     */
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.circuitBreakerThreshold) {
            this.circuitOpen = true;
        }
    }

    /**
     * Record a success (reset failure count)
     */
    recordSuccess() {
        this.failureCount = 0;
        this.circuitOpen = false;
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Execute a function with rate limiting and retry logic
     * @param {Function} fn - Function to execute
     * @param {Object} options - Options
     * @returns {Promise}
     */
    async execute(fn, options = {}) {
        const maxRetries = options.maxRetries || this.maxRetries;
        let lastError = null;

        // Check circuit breaker
        if (this.isCircuitOpen()) {
            throw new Error('Circuit breaker is open. Too many failures.');
        }

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await fn();
                this.recordSuccess();
                return result;
            } catch (error) {
                lastError = error;

                // Check if it's a rate limit error
                const isRateLimit = error.status === 429 || error.status === 403;
                
                if (isRateLimit) {
                    this.recordFailure();
                    
                    if (attempt < maxRetries) {
                        const delay = this.calculateDelay(attempt);
                        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
                        await this.sleep(delay);
                        continue;
                    }
                } else {
                    // Non-rate-limit error, don't retry
                    throw error;
                }
            }
        }

        // All retries exhausted
        this.recordFailure();
        throw lastError;
    }
}

module.exports = RateLimiter;

