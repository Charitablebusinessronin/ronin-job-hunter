# Notion Profile Integration

## Overview

The Ronin Job Hunter system now integrates with your Notion "📝 Sabir's Professional Profile" database to automatically load personal profile data for resume generation.

## Database Information

- **Database Name**: 📝 Sabir's Professional Profile
- **Database ID**: `ec190f37-7787-4de3-b5fb-11841164215d`
- **Data Source URL**: `collection://ec190f37-7787-4de3-b5fb-11841164215d`

## Setup

Add the following to your `.env` file:

```bash
NOTION_PROFILE_DB_ID=ec190f37-7787-4de3-b5fb-11841164215d
```

## Database Schema

The profile database uses the following properties:

- **Section** (Title): Entry name/title
- **Type** (Select): Work Experience, Education, Skill, Project, Certification, Achievement, Personal
- **Category** (Text): Additional categorization
- **Role/Title** (Text): Job title, degree, or role name
- **Organization** (Text): Company, school, or organization name
- **Details** (Text): Description or details
- **Time Period** (Date): Start and end dates
- **Skills Used** (Multi-select): Associated skills/tags
- **Display Order** (Number): Sorting order
- **Include in Resume** (Checkbox): Filter for resume generation

## How It Works

1. **Profile Loading**: When `ResumeBuilder` is initialized with `NOTION_PROFILE_DB_ID`, it creates a `NotionProfileFetcher` instance.

2. **Data Fetching**: On first resume generation, the system:
   - Queries the Notion database for entries where "Include in Resume" is checked
   - Sorts by "Display Order"
   - Transforms the data into structured resume format

3. **Resume Structure**: The fetched data is transformed into:
   - **Work Experience**: From "Work Experience" type entries
   - **Education**: From "Education" type entries
   - **Skills**: Aggregated from "Skill" type entries and skills tags
   - **Projects**: From "Project" type entries
   - **Certifications**: From "Certification" type entries
   - **Achievements**: From "Achievement" type entries
   - **Contact/Summary**: From "Personal" type entries

4. **Caching**: Profile data is cached after first load to avoid repeated API calls.

5. **Resume Generation**: The master resume data is used as input to:
   - Keyword extraction from job descriptions
   - AI-powered resume tailoring
   - Cover letter generation

## Files Created/Modified

### New Files
- `backend/notion/profile-fetcher.js`: Fetches and transforms profile data from Notion
- `scripts/get-profile-db-id.js`: Helper script to find profile database ID
- `PROFILE_INTEGRATION.md`: This documentation

### Modified Files
- `backend/pdf/resume-builder.js`: Added profile loading and caching
- `backend/workflows/main-workflow.js`: Passes profile database config to ResumeBuilder
- `README.md`: Added profile database setup instructions

## Usage

The integration is automatic once `NOTION_PROFILE_DB_ID` is set in your environment. No code changes needed.

When generating resumes:
1. System checks if `masterResume` is provided in config
2. If not, loads from Notion profile database
3. Uses the profile data for resume tailoring

## Testing

To test the integration:

```bash
# Set environment variable
export NOTION_PROFILE_DB_ID=ec190f37-7787-4de3-b5fb-11841164215d

# Run a test resume generation (requires a job in database)
cd backend
node -e "
const ResumeBuilder = require('./pdf/resume-builder');
const builder = new ResumeBuilder({
  openaiApiKey: process.env.OPENAI_API_KEY,
  debugPort: 9222,
  outputDir: './outputs',
  notionApiKey: process.env.NOTION_API_KEY,
  profileDatabaseId: process.env.NOTION_PROFILE_DB_ID,
});
builder.loadMasterResumeFromNotion().then(data => {
  console.log('Profile loaded:', JSON.stringify(data, null, 2));
});
"
```

## Benefits

1. **Single Source of Truth**: Profile data lives in Notion, easy to update
2. **Automatic Updates**: Changes in Notion automatically reflect in generated resumes
3. **Flexible Filtering**: Use "Include in Resume" checkbox to control what appears
4. **Structured Data**: Type-based organization makes data transformation reliable
5. **No Manual JSON**: No need to maintain separate resume JSON files

## Future Enhancements

- Support for multiple profile versions (e.g., technical vs. business resume)
- Profile validation and completeness checks
- Automatic skill extraction and matching
- Profile change notifications

