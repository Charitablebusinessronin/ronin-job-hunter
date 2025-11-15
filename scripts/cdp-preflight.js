#!/usr/bin/env node
/**
 * CDP Preflight Check
 * Verifies Chrome DevTools Protocol is accessible and checks login status
 */

const { CDPSessionManager, JOB_BOARD_SELECTORS } = require('../backend/utils/cdp-session');
const Logger = require('../backend/utils/logger');

async function main() {
    const logger = new Logger('CDP-Preflight');
    const config = {
        debugPort: process.env.CHROME_DEBUG_PORT || 9222,
    };

    logger.info('Starting CDP preflight check', { port: config.debugPort });

    try {
        const sessionManager = new CDPSessionManager(config);
        
        // Connect to Chrome
        await sessionManager.connect();
        logger.info('✓ Connected to Chrome via CDP');

        // Check login status for all job boards
        const jobBoards = [
            { name: 'Lever', ...JOB_BOARD_SELECTORS.lever },
            { name: 'Greenhouse', ...JOB_BOARD_SELECTORS.greenhouse },
            { name: 'Workday', ...JOB_BOARD_SELECTORS.workday },
        ];

        const loginStatus = await sessionManager.checkAllJobBoards(jobBoards);

        // Report results
        const allLoggedIn = Object.values(loginStatus).every(status => status === true);
        const loggedInBoards = Object.entries(loginStatus)
            .filter(([_, status]) => status)
            .map(([name]) => name);
        const loggedOutBoards = Object.entries(loginStatus)
            .filter(([_, status]) => !status)
            .map(([name]) => name);

        logger.info('Login status check complete', {
            allLoggedIn,
            loggedInBoards,
            loggedOutBoards,
        });

        if (!allLoggedIn) {
            logger.warn('Some job boards are not logged in', {
                loggedOutBoards,
            });
            console.log('\n⚠️  Human-in-loop required:');
            console.log('Please log in to the following job boards:');
            loggedOutBoards.forEach(board => console.log(`  - ${board}`));
            console.log('\nAfter logging in, run this script again to verify.');
            process.exit(1);
        }

        logger.info('✓ All job boards are logged in');
        console.log('\n✓ CDP preflight check passed');
        process.exit(0);

    } catch (error) {
        logger.error('CDP preflight check failed', error);
        console.error('\n✗ CDP preflight check failed:', error.message);
        console.error('\nPlease ensure:');
        console.error('  1. Chrome is running with --remote-debugging-port=9222');
        console.error('  2. Chrome debug port is accessible');
        console.error('  3. Browserless/Chrome container is running (if using Docker)');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };

