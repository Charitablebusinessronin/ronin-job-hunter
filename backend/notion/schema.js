/**
 * Notion Database Schema Definitions
 * Maps our data model to Notion database properties
 */

const JOBS_DB_SCHEMA = {
    Title: { type: 'title', name: 'Title' },
    Company: { type: 'rich_text', name: 'Company' },
    Source: { type: 'select', name: 'Source', options: ['Lever', 'Greenhouse', 'Workday', 'Indeed', 'BuiltIn', 'Wellfound', 'Other'] },
    'External Job ID': { type: 'rich_text', name: 'External Job ID' },
    URL: { type: 'url', name: 'URL' },
    Location: { type: 'rich_text', name: 'Location' },
    Remote: { type: 'checkbox', name: 'Remote' },
    'Posted At': { type: 'date', name: 'Posted At' },
    Seniority: { type: 'select', name: 'Seniority', options: ['Entry', 'Associate', 'Mid', 'Senior', 'Lead', 'Manager', 'Director'] },
    Function: { type: 'multi_select', name: 'Function', options: ['CPG Sales', 'Ecommerce', 'Procurement', 'Operations', 'Marketing', 'Data'] },
    Score: { type: 'number', name: 'Score' },
    Status: { type: 'status', name: 'Status', options: ['To Review', 'Ready', 'Deprioritized'] },
    Notes: { type: 'rich_text', name: 'Notes' },
    Applications: { type: 'relation', name: 'Applications' },
    'Dedupe Hash': { type: 'rich_text', name: 'Dedupe Hash' },
};

const APPLICATIONS_DB_SCHEMA = {
    Title: { type: 'title', name: 'Title' },
    Job: { type: 'relation', name: 'Job' },
    Stage: { type: 'status', name: 'Stage', options: ['To Review', 'Ready', 'Submitted', 'Blocked', 'Interviewing', 'Offer', 'Rejected'] },
    'Applied At': { type: 'date', name: 'Applied At' },
    Method: { type: 'select', name: 'Method', options: ['Auto-Apply', 'Prepared', 'Manual'] },
    'Resume Variant': { type: 'files', name: 'Resume Variant' },
    'Cover Letter': { type: 'files', name: 'Cover Letter' },
    'Contact Name': { type: 'rich_text', name: 'Contact Name' },
    'Contact Email': { type: 'email', name: 'Contact Email' },
    'Tracker URL': { type: 'url', name: 'Tracker URL' },
    Notes: { type: 'rich_text', name: 'Notes' },
};

module.exports = {
    JOBS_DB_SCHEMA,
    APPLICATIONS_DB_SCHEMA,
};

