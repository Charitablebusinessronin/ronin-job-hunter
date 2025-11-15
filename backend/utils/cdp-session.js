/**
 * CDP Browser Session Management
 * Handles Chrome DevTools Protocol connection and session verification
 */

const puppeteer = require('puppeteer-core');
const axios = require('axios');

class CDPSessionManager {
    constructor(config = {}) {
        this.debugPort = config.debugPort || 9222;
        this.debugUrl = `http://localhost:${this.debugPort}`;
        this.browser = null;
        this.page = null;
    }

    /**
     * Connect to existing Chrome instance via CDP
     * Supports both direct Chrome and browserless
     */
    async connect() {
        try {
            // Check if CDP is accessible
            const response = await axios.get(`${this.debugUrl}/json/version`);
            console.log('CDP Version:', response.data);

            let webSocketUrl = null;

            // Browserless provides webSocketDebuggerUrl directly in version response
            if (response.data.webSocketDebuggerUrl) {
                webSocketUrl = response.data.webSocketDebuggerUrl;
            } else {
                // For direct Chrome, get browser target from list
                const targets = await axios.get(`${this.debugUrl}/json/list`);
                const browserTarget = targets.data.find(t => t.type === 'browser');
                
                if (!browserTarget) {
                    throw new Error('No browser target found');
                }
                
                webSocketUrl = browserTarget.webSocketDebuggerUrl;
            }

            // Connect to browser
            this.browser = await puppeteer.connect({
                browserWSEndpoint: webSocketUrl,
                defaultViewport: null,
            });

            console.log('✓ Connected to Chrome via CDP');
            return this.browser;
        } catch (error) {
            console.error('Failed to connect to CDP:', error.message);
            throw error;
        }
    }

    /**
     * Check if user is logged into a specific job board
     * @param {string} url - Job board URL
     * @param {Object} selectors - Selectors to check for logged-in state
     * @returns {boolean}
     */
    async checkLoginStatus(url, selectors = {}) {
        if (!this.browser) {
            await this.connect();
        }

        try {
            const page = await this.browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Check for logged-in indicators
            let isLoggedIn = false;

            if (selectors.loggedInSelector) {
                try {
                    await page.waitForSelector(selectors.loggedInSelector, { timeout: 5000 });
                    isLoggedIn = true;
                } catch (e) {
                    // Selector not found, likely not logged in
                }
            }

            if (selectors.loggedOutSelector) {
                try {
                    await page.waitForSelector(selectors.loggedOutSelector, { timeout: 5000 });
                    isLoggedIn = false;
                } catch (e) {
                    // Selector not found, might be logged in
                }
            }

            await page.close();
            return isLoggedIn;
        } catch (error) {
            console.error(`Error checking login status for ${url}:`, error.message);
            return false;
        }
    }

    /**
     * Check login status for multiple job boards
     * @param {Array} jobBoards - Array of {name, url, selectors} objects
     * @returns {Object} Status for each job board
     */
    async checkAllJobBoards(jobBoards) {
        const status = {};

        for (const board of jobBoards) {
            console.log(`Checking login status for ${board.name}...`);
            status[board.name] = await this.checkLoginStatus(board.url, board.selectors);
            console.log(`${board.name}: ${status[board.name] ? '✓ Logged in' : '✗ Not logged in'}`);
        }

        return status;
    }

    /**
     * Get a new page from the browser
     */
    async getPage() {
        if (!this.browser) {
            await this.connect();
        }

        if (!this.page) {
            this.page = await this.browser.newPage();
        }

        return this.page;
    }

    /**
     * Close the session
     */
    async close() {
        if (this.page) {
            await this.page.close();
            this.page = null;
        }
        // Don't disconnect browser - it's managed externally
    }
}

// Job board login selectors
const JOB_BOARD_SELECTORS = {
    lever: {
        url: 'https://jobs.lever.co/',
        selectors: {
            loggedInSelector: '[data-qa="user-menu"]',
            loggedOutSelector: 'a[href*="/login"]',
        },
    },
    greenhouse: {
        url: 'https://boards.greenhouse.io/',
        selectors: {
            loggedInSelector: '[data-testid="user-menu"]',
            loggedOutSelector: 'a[href*="/login"]',
        },
    },
    workday: {
        url: 'https://www.myworkday.com/',
        selectors: {
            loggedInSelector: '[data-automation-id="userMenu"]',
            loggedOutSelector: 'a[href*="/login"]',
        },
    },
};

module.exports = {
    CDPSessionManager,
    JOB_BOARD_SELECTORS,
};

