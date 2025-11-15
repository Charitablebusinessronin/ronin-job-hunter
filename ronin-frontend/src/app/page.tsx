/**
 * Home Page - Job Review Kanban
 * Mobile-first job review interface
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Kanban } from '@/components/kanban';
import { BottomNavigation } from '@/components/navigation';
import type { NotionJob } from '@/lib/notion/types';

async function fetchJobs(): Promise<NotionJob[]> {
  const response = await fetch('/api/jobs');
  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }
  const data = await response.json();
  return data.jobs;
}

export default function HomePage() {
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const handleJobAction = async (job: NotionJob, action: 'apply' | 'maybe' | 'skip') => {
    try {
      const newStatus =
        action === 'apply' ? 'Ready' : action === 'maybe' ? 'To Review' : 'Deprioritized';

      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      // Optimistic update - refetch
      window.location.reload();
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const handleJobTap = (job: NotionJob) => {
    window.location.href = `/jobs/${job.id}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load jobs</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Job Review</h1>
          <p className="text-sm text-muted-foreground">
            {jobs.length} jobs found
          </p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Kanban
          jobs={jobs}
          onJobAction={handleJobAction}
          onJobTap={handleJobTap}
        />
      </main>
      <BottomNavigation />
    </div>
  );
}
