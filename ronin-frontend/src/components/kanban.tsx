/**
 * Kanban Board Component
 * Mobile-first kanban view for job review
 */

'use client';

import { JobCard } from './job-card';
import type { NotionJob } from '@/lib/notion/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KanbanProps {
  jobs: NotionJob[];
  onJobAction?: (job: NotionJob, action: 'apply' | 'maybe' | 'skip') => void;
  onJobTap?: (job: NotionJob) => void;
}

type KanbanColumn = 'New Jobs' | 'To Apply' | 'Applied' | 'Interviewing' | 'Archived';

export function Kanban({ jobs, onJobAction, onJobTap }: KanbanProps) {
  const columns: KanbanColumn[] = ['New Jobs', 'To Apply', 'Applied', 'Interviewing', 'Archived'];

  const getJobsForColumn = (column: KanbanColumn): NotionJob[] => {
    switch (column) {
      case 'New Jobs':
        return jobs.filter(j => j.status === 'To Review');
      case 'To Apply':
        return jobs.filter(j => j.status === 'Ready');
      case 'Applied':
        // This would come from Applications database
        return [];
      case 'Interviewing':
        // This would come from Applications database
        return [];
      case 'Archived':
        return jobs.filter(j => j.status === 'Deprioritized');
      default:
        return [];
    }
  };

  const handleAction = (job: NotionJob, action: 'apply' | 'maybe' | 'skip') => {
    onJobAction?.(job, action);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
      {columns.map((column) => {
        const columnJobs = getJobsForColumn(column);
        return (
          <div
            key={column}
            className="flex-shrink-0 w-[90vw] max-w-sm snap-start"
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  {column}
                  <span className="ml-2 text-sm text-muted-foreground font-normal">
                    ({columnJobs.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
                {columnJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No jobs in this column
                  </p>
                ) : (
                  columnJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onApply={() => handleAction(job, 'apply')}
                      onMaybe={() => handleAction(job, 'maybe')}
                      onSkip={() => handleAction(job, 'skip')}
                      onTap={onJobTap}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

