/**
 * Job Detail Page
 * Full job details with score breakdown and PDF previews
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { NotionJob } from '@/lib/notion/types';
import { BottomNavigation } from '@/components/navigation';

async function fetchJob(id: string): Promise<NotionJob> {
  const response = await fetch(`/api/jobs/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch job');
  }
  const data = await response.json();
  return data.job;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetchJob(jobId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load job</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const scoreComponents = JSON.parse((job as any).scoreComponents || '{}');

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-2">
            ← Back
          </Button>
          <h1 className="text-xl font-bold">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.company}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Match Score: {job.score}/100</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Title Match</span>
                <span className="font-semibold">{scoreComponents.title || 0}/30</span>
              </div>
              <div className="flex justify-between">
                <span>Skills Match</span>
                <span className="font-semibold">{scoreComponents.skills || 0}/25</span>
              </div>
              <div className="flex justify-between">
                <span>Location/Remote</span>
                <span className="font-semibold">{scoreComponents.location || 0}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Recency</span>
                <span className="font-semibold">{scoreComponents.recency || 0}/15</span>
              </div>
              <div className="flex justify-between">
                <span>Company Fit</span>
                <span className="font-semibold">{scoreComponents.companyFit || 0}/10</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold mb-1">Location</p>
              <p className="text-sm">{job.location} {job.remote && '(Remote)'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Source</p>
              <Badge variant="outline">{job.source}</Badge>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Functions</p>
              <div className="flex flex-wrap gap-1">
                {job.function.map((func) => (
                  <Badge key={func} variant="secondary">
                    {func}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Posted</p>
              <p className="text-sm">{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Unknown'}</p>
            </div>
            <Button
              asChild
              className="w-full mt-4"
            >
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                View Job Posting
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Generated Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generated Materials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                const response = await fetch(`/api/resume/${job.id}`);
                const data = await response.json();
                window.open(data.resumeUrl, '_blank');
              }}
            >
              📄 Download Resume
            </Button>
            <Button
              variant="outline"
              className="w-full"
            >
              📝 Download Cover Letter
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={async () => {
              await fetch(`/api/jobs/${job.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Ready' }),
              });
              window.location.href = '/';
            }}
          >
            ✅ Apply
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={async () => {
              await fetch(`/api/jobs/${job.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Deprioritized' }),
              });
              window.location.href = '/';
            }}
          >
            ❌ Skip
          </Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}

