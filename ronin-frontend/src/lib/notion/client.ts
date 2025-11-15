/**
 * Notion API Client
 * Wrapper around @notionhq/client with error handling
 */

import { Client } from '@notionhq/client';

export function createNotionClient(apiKey: string): Client {
  if (!apiKey) {
    throw new Error('Notion API key is required');
  }

  return new Client({ auth: apiKey });
}

export const notionClient = createNotionClient(
  process.env.NEXT_PUBLIC_NOTION_API_KEY || ''
);

