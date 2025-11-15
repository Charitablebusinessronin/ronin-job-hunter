/**
 * Job Card Component
 * Mobile-first job card with swipe gestures
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { NotionJob } from '@/lib/notion/types';
import { useState } from 'react';

interface JobCardProps {
  job: NotionJob;
  onApply?: (job: NotionJob) => void;
  onMaybe?: (job: NotionJob) => void;
  onSkip?: (job: NotionJob) => void;
  onTap?: (job: NotionJob) => void;
}

export function JobCard({ job, onApply, onMaybe, onSkip, onTap }: JobCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - e.touches[0].clientX;
    setSwipeOffset(deltaX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (swipeOffset > 100) {
      onApply?.(job);
    } else if (swipeOffset < -100) {
      onSkip?.(job);
    }
    setSwipeOffset(0);
  };

  return (
    <Card
      className="touch-none select-none cursor-pointer transition-transform active:scale-95"
      style={{ transform: `translateX(${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => onTap?.(job)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold mb-1">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{job.company}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              className={`${getScoreColor(job.score)} text-white`}
              variant="default"
            >
              {job.score}
            </Badge>
            {job.remote && (
              <Badge variant="outline" className="text-xs">
                Remote
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {job.function.slice(0, 3).map((func) => (
              <Badge key={func} variant="secondary" className="text-xs">
                {func}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {job.location} • {job.source}
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 h-10"
              onClick={(e) => {
                e.stopPropagation();
                onApply?.(job);
              }}
            >
              ✅ Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-10"
              onClick={(e) => {
                e.stopPropagation();
                onMaybe?.(job);
              }}
            >
              🤔 Maybe
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 h-10"
              onClick={(e) => {
                e.stopPropagation();
                onSkip?.(job);
              }}
            >
              ❌ Skip
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

