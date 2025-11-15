/**
 * API Route: GET /api/resume/[jobId]
 * Returns URL to generated resume PDF for a job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createJobRepository } from '@/lib/notion';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const repository = createJobRepository();
    const job = await repository.getJobById(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // For now, return a placeholder URL
    // In production, this would point to the actual PDF file
    // stored in Cloudflare R2, S3, or similar
    const resumeUrl = `/api/files/resume/${jobId}.pdf`;

    return NextResponse.json({ resumeUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching resume URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resume URL' },
      { status: 500 }
    );
  }
}

