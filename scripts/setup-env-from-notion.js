#!/usr/bin/env node
/**
 * Setup Environment Variables from Notion
 * Extracts API keys and database IDs from Notion workspace
 */

// Try to load dotenv if available (optional)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, continue without it
}

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');

async function findNotionDatabases(notion) {
  console.log('Searching for Jobs and Applications databases...');
  
  try {
    // Search for databases with "Jobs" or "Applications" in the title
    const searchResults = await notion.search({
      filter: {
        property: 'object',
        value: 'database',
      },
    });

    const databases = searchResults.results
      .filter(result => result.object === 'database')
      .map(db => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
        url: db.url,
      }));

    console.log(`\nFound ${databases.length} databases:`);
    databases.forEach(db => {
      console.log(`  - ${db.title}: ${db.id}`);
    });

    // Find Jobs database
    const jobsDb = databases.find(db => 
      db.title.toLowerCase().includes('job') && 
      !db.title.toLowerCase().includes('application')
    );

    // Find Applications database
    const applicationsDb = databases.find(db => 
      db.title.toLowerCase().includes('application')
    );

    return { jobsDb, applicationsDb, allDatabases: databases };
  } catch (error) {
    console.error('Error searching for databases:', error.message);
    throw error;
  }
}

async function updateEnvFile(envPath, updates) {
  let envContent = '';
  
  try {
    envContent = await fs.readFile(envPath, 'utf8');
  } catch (error) {
    // File doesn't exist, create it
    console.log(`Creating new .env file at ${envPath}`);
  }

  // Parse existing env file
  const lines = envContent.split('\n');
  const envVars = {};
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
  });

  // Update with new values
  Object.assign(envVars, updates);

  // Write back to file
  const newLines = Object.entries(envVars).map(([key, value]) => {
    return `${key}="${value}"`;
  });

  await fs.writeFile(envPath, newLines.join('\n') + '\n', 'utf8');
  console.log(`\n✓ Updated ${envPath}`);
}

async function main() {
  const notionApiKey = process.env.NOTION_API_KEY;

  if (!notionApiKey) {
    console.error('ERROR: NOTION_API_KEY environment variable is required');
    console.error('\nPlease set it first:');
    console.error('  export NOTION_API_KEY="your_notion_api_key"');
    console.error('\nOr add it to your .env file');
    process.exit(1);
  }

  const notion = new Client({ auth: notionApiKey });

  try {
    // Test API connection
    console.log('Testing Notion API connection...');
    await notion.users.me();
    console.log('✓ Connected to Notion API\n');

    // Find databases
    const { jobsDb, applicationsDb, allDatabases } = await findNotionDatabases(notion);

    if (!jobsDb) {
      console.warn('\n⚠️  Jobs database not found automatically');
      console.log('Available databases:');
      allDatabases.forEach(db => console.log(`  - ${db.title} (${db.id})`));
      console.log('\nPlease manually set NOTION_JOBS_DB_ID in your .env file');
    }

    if (!applicationsDb) {
      console.warn('\n⚠️  Applications database not found automatically');
      console.log('Available databases:');
      allDatabases.forEach(db => console.log(`  - ${db.title} (${db.id})`));
      console.log('\nPlease manually set NOTION_APPLICATIONS_DB_ID in your .env file');
    }

    // Update .env file
    const envPath = path.join(__dirname, '..', '.env');
    const updates = {};

    if (jobsDb) {
      updates.NOTION_JOBS_DB_ID = jobsDb.id;
      console.log(`\n✓ Found Jobs database: ${jobsDb.title}`);
    }

    if (applicationsDb) {
      updates.NOTION_APPLICATIONS_DB_ID = applicationsDb.id;
      console.log(`✓ Found Applications database: ${applicationsDb.title}`);
    }

    // Keep existing NOTION_API_KEY if present
    if (notionApiKey) {
      updates.NOTION_API_KEY = notionApiKey;
    }

    if (Object.keys(updates).length > 0) {
      await updateEnvFile(envPath, updates);
      console.log('\n✓ Environment variables configured!');
    } else {
      console.log('\n⚠️  No databases found. Please configure manually.');
    }

    // Also update frontend .env.local
    const frontendEnvPath = path.join(__dirname, '..', 'ronin-frontend', '.env.local');
    const frontendUpdates = {
      NEXT_PUBLIC_NOTION_API_KEY: notionApiKey,
    };

    if (jobsDb) {
      frontendUpdates.NEXT_PUBLIC_NOTION_JOBS_DB_ID = jobsDb.id;
    }

    if (applicationsDb) {
      frontendUpdates.NEXT_PUBLIC_NOTION_APPLICATIONS_DB_ID = applicationsDb.id;
    }

    await updateEnvFile(frontendEnvPath, frontendUpdates);
    console.log('✓ Frontend environment variables configured!');

    console.log('\n📝 Next steps:');
    console.log('  1. Add OPENAI_API_KEY to your .env file');
    console.log('  2. Configure CHROME_DEBUG_PORT and CHROME_PROFILE_PATH if needed');
    console.log('  3. Run: docker-compose up -d');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.code === 'object_not_found') {
      console.error('\nThis might mean:');
      console.error('  - The API key is invalid');
      console.error('  - The API key doesn\'t have access to the workspace');
      console.error('  - The databases don\'t exist yet (run create-notion-db.js first)');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { findNotionDatabases, updateEnvFile };

