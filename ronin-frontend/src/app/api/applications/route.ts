/**
 * API Route: GET /api/applications
 * Returns list of applications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient } from '@/lib/notion/client';

export async function GET(request: NextRequest) {
  try {
    const applicationsDatabaseId = process.env.NEXT_PUBLIC_NOTION_APPLICATIONS_DB_ID;
    const notionApiKey = process.env.NEXT_PUBLIC_NOTION_API_KEY;

    if (!applicationsDatabaseId || !notionApiKey) {
      return NextResponse.json(
        { error: 'Applications database ID or API key not configured' },
        { status: 500 }
      );
    }

    const notionClient = createNotionClient(notionApiKey);
    // @ts-expect-error - Notion client v5 types may be incomplete for databases.query
    const response = await notionClient.databases.query({
      database_id: applicationsDatabaseId,
      sorts: [
        { property: 'Applied At', direction: 'descending' },
      ],
    });

    const applications = response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: props.Title?.title?.[0]?.plain_text || '',
        jobId: props.Job?.relation?.[0]?.id || '',
        stage: props.Stage?.status?.name || 'To Review',
        appliedAt: props['Applied At']?.date?.start || null,
        method: props.Method?.select?.name || 'Prepared',
        resumeVariant: props['Resume Variant']?.files?.[0]?.file?.url || null,
        coverLetter: props['Cover Letter']?.files?.[0]?.file?.url || null,
        contactName: props['Contact Name']?.rich_text?.[0]?.plain_text || null,
        contactEmail: props['Contact Email']?.email || null,
        trackerUrl: props['Tracker URL']?.url || null,
        notes: props.Notes?.rich_text?.[0]?.plain_text || null,
      };
    });

    return NextResponse.json({ applications }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

