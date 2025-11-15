/**
 * API Route: GET /api/jobs
 * Returns list of jobs with optional filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createJobRepository } from '@/lib/notion';
import type { JobFilters } from '@/lib/notion/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: JobFilters = {};
    
    // Parse status filter
    const statusParam = searchParams.get('status');
    if (statusParam) {
      filters.status = statusParam.split(',') as any[];
    }

    // Parse source filter
    const sourceParam = searchParams.get('source');
    if (sourceParam) {
      filters.source = sourceParam.split(',') as any[];
    }

    // Parse function filter
    const functionParam = searchParams.get('function');
    if (functionParam) {
      filters.function = functionParam.split(',');
    }

    // Parse score filter
    const minScoreParam = searchParams.get('minScore');
    if (minScoreParam) {
      filters.minScore = parseInt(minScoreParam, 10);
    }

    // Parse remote filter
    const remoteParam = searchParams.get('remote');
    if (remoteParam !== null) {
      filters.remote = remoteParam === 'true';
    }

    // Parse search filter
    const searchParam = searchParams.get('search');
    if (searchParam) {
      filters.search = searchParam;
    }

    const repository = createJobRepository();
    const jobs = await repository.getJobs(filters);

    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

