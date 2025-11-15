/**
 * API Route: GET /api/jobs/[id] and PATCH /api/jobs/[id]
 * Get job details and update job status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createJobRepository } from '@/lib/notion';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repository = createJobRepository();
    const job = await repository.getJobById(params.id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ job }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const repository = createJobRepository();

    if (body.status) {
      await repository.updateJobStatus(params.id, body.status);
    }

    if (body.feedback) {
      await repository.addFeedback(params.id, body.feedback);
    }

    const job = await repository.getJobById(params.id);

    return NextResponse.json({ job }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}

