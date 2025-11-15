# Setup Scripts

## setup-env-from-notion.js

Automatically extracts Notion API keys and database IDs from your Notion workspace and configures your `.env` files.

### Usage

1. First, set your Notion API key:
   ```bash
   export NOTION_API_KEY="your_notion_api_key_here"
   ```

2. Run the setup script:
   ```bash
   cd backend
   npm install
   node ../scripts/setup-env-from-notion.js
   ```

The script will:
- Test your Notion API connection
- Search for "Jobs" and "Applications" databases
- Update `.env` with database IDs
- Update `ronin-frontend/.env.local` with frontend environment variables

### Manual Configuration

If the script can't find your databases automatically, you can:

1. Get database IDs from Notion URLs:
   - Open your database in Notion
   - Copy the URL (e.g., `https://www.notion.so/abc123def456...`)
   - The database ID is the part after the last `/` (remove any `?v=...` query params)

2. Manually edit `.env`:
   ```bash
   NOTION_API_KEY="your_key"
   NOTION_JOBS_DB_ID="database_id_here"
   NOTION_APPLICATIONS_DB_ID="database_id_here"
   ```

## create-notion-db.js

Creates the Jobs and Applications databases in Notion if they don't exist.

### Usage

```bash
cd backend
npm install
NOTION_PARENT_PAGE_ID="your_parent_page_id" node scripts/create-notion-db.js
```

## cdp-preflight.js

Checks Chrome DevTools Protocol connection and verifies login status for job boards.

### Usage

```bash
cd backend
npm install
node scripts/cdp-preflight.js
```

