#!/usr/bin/env node
/**
 * Create Notion Databases
 * Creates Jobs and Applications databases in Notion if they don't exist
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function createJobsDatabase(parentPageId) {
    console.log('Creating Jobs database...');

    try {
        const response = await notion.databases.create({
            parent: { page_id: parentPageId },
            title: [{ text: { content: 'Jobs Found' } }],
            properties: {
                'Title': { title: {} },
                'Company': { rich_text: {} },
                'Source': {
                    select: {
                        options: [
                            { name: 'Lever', color: 'blue' },
                            { name: 'Greenhouse', color: 'green' },
                            { name: 'Workday', color: 'orange' },
                            { name: 'Indeed', color: 'purple' },
                            { name: 'BuiltIn', color: 'pink' },
                            { name: 'Wellfound', color: 'yellow' },
                            { name: 'Other', color: 'gray' },
                        ],
                    },
                },
                'External Job ID': { rich_text: {} },
                'URL': { url: {} },
                'Location': { rich_text: {} },
                'Remote': { checkbox: {} },
                'Posted At': { date: {} },
                'Seniority': {
                    select: {
                        options: [
                            { name: 'Entry', color: 'gray' },
                            { name: 'Associate', color: 'blue' },
                            { name: 'Mid', color: 'green' },
                            { name: 'Senior', color: 'orange' },
                            { name: 'Lead', color: 'red' },
                            { name: 'Manager', color: 'purple' },
                            { name: 'Director', color: 'pink' },
                        ],
                    },
                },
                'Function': {
                    multi_select: {
                        options: [
                            { name: 'CPG Sales', color: 'blue' },
                            { name: 'Ecommerce', color: 'green' },
                            { name: 'Procurement', color: 'orange' },
                            { name: 'Operations', color: 'purple' },
                            { name: 'Marketing', color: 'pink' },
                            { name: 'Data', color: 'yellow' },
                        ],
                    },
                },
                'Score': { number: {} },
                'Status': {
                    status: {
                        options: [
                            { name: 'To Review', color: 'yellow' },
                            { name: 'Ready', color: 'green' },
                            { name: 'Deprioritized', color: 'gray' },
                        ],
                    },
                },
                'Notes': { rich_text: {} },
                'Applications': { relation: {} },
                'Dedupe Hash': { rich_text: {} },
            },
        });

        console.log('✓ Jobs database created:', response.id);
        console.log('  URL:', response.url);
        return response.id;
    } catch (error) {
        console.error('Failed to create Jobs database:', error.message);
        throw error;
    }
}

async function createApplicationsDatabase(parentPageId, jobsDbId) {
    console.log('Creating Applications database...');

    try {
        const response = await notion.databases.create({
            parent: { page_id: parentPageId },
            title: [{ text: { content: 'Applications' } }],
            properties: {
                'Title': { title: {} },
                'Job': {
                    relation: {
                        database_id: jobsDbId,
                    },
                },
                'Stage': {
                    status: {
                        options: [
                            { name: 'To Review', color: 'yellow' },
                            { name: 'Ready', color: 'blue' },
                            { name: 'Submitted', color: 'green' },
                            { name: 'Blocked', color: 'red' },
                            { name: 'Interviewing', color: 'purple' },
                            { name: 'Offer', color: 'pink' },
                            { name: 'Rejected', color: 'gray' },
                        ],
                    },
                },
                'Applied At': { date: {} },
                'Method': {
                    select: {
                        options: [
                            { name: 'Auto-Apply', color: 'green' },
                            { name: 'Prepared', color: 'blue' },
                            { name: 'Manual', color: 'gray' },
                        ],
                    },
                },
                'Resume Variant': { files: {} },
                'Cover Letter': { files: {} },
                'Contact Name': { rich_text: {} },
                'Contact Email': { email: {} },
                'Tracker URL': { url: {} },
                'Notes': { rich_text: {} },
            },
        });

        console.log('✓ Applications database created:', response.id);
        console.log('  URL:', response.url);
        return response.id;
    } catch (error) {
        console.error('Failed to create Applications database:', error.message);
        throw error;
    }
}

async function main() {
    const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

    if (!parentPageId) {
        console.error('ERROR: NOTION_PARENT_PAGE_ID environment variable is required');
        console.error('Please set it to the ID of the Notion page where databases should be created');
        process.exit(1);
    }

    try {
        const jobsDbId = await createJobsDatabase(parentPageId);
        const applicationsDbId = await createApplicationsDatabase(parentPageId, jobsDbId);

        console.log('\n✓ Databases created successfully!');
        console.log('\nAdd these to your .env file:');
        console.log(`NOTION_JOBS_DB_ID=${jobsDbId}`);
        console.log(`NOTION_APPLICATIONS_DB_ID=${applicationsDbId}`);
    } catch (error) {
        console.error('\n✗ Failed to create databases:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createJobsDatabase, createApplicationsDatabase };

