#!/usr/bin/env node
/**
 * Get Notion Profile Database ID
 * Searches for "📝 Sabir's Professional Profile" database and returns its ID
 */

// Try to load dotenv from backend/node_modules, fallback to root
try {
    require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
} catch (e) {
    try {
        require('dotenv').config();
    } catch (e2) {
        // dotenv not available, will use environment variables directly
    }
}

const { Client } = require('@notionhq/client');

async function getProfileDatabaseId() {
    const notionApiKey = process.env.NOTION_API_KEY;
    
    if (!notionApiKey) {
        console.error('ERROR: NOTION_API_KEY environment variable is required');
        process.exit(1);
    }

    const notion = new Client({ auth: notionApiKey });

    try {
        // Search for the profile database
        const response = await notion.search({
            query: "Sabir's Professional Profile",
            filter: {
                property: 'object',
                value: 'database',
            },
        });

        const databases = response.results.filter(
            page => page.object === 'database' && 
            (page.title?.[0]?.plain_text?.includes('Professional Profile') || 
             page.title?.[0]?.plain_text?.includes('Sabir'))
        );

        if (databases.length === 0) {
            console.error('ERROR: Could not find "📝 Sabir\'s Professional Profile" database');
            console.log('Make sure the database exists and is accessible with your Notion API key');
            process.exit(1);
        }

        const database = databases[0];
        const databaseId = database.id;
        const databaseTitle = database.title?.[0]?.plain_text || 'Unknown';

        console.log(`Found database: ${databaseTitle}`);
        console.log(`Database ID: ${databaseId}`);
        console.log(`\nAdd this to your .env file:`);
        console.log(`NOTION_PROFILE_DB_ID=${databaseId}`);

        return databaseId;
    } catch (error) {
        console.error('ERROR: Failed to search for profile database', error.message);
        if (error.code === 'unauthorized') {
            console.error('Make sure your NOTION_API_KEY is valid and has access to the database');
        }
        process.exit(1);
    }
}

if (require.main === module) {
    getProfileDatabaseId()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = getProfileDatabaseId;

