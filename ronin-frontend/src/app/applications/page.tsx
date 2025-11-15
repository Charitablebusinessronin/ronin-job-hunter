/**
 * Applications Tracker Page
 * View and manage application status
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BottomNavigation } from '@/components/navigation';

interface Application {
  id: string;
  title: string;
  stage: string;
  appliedAt: string | null;
  method: string;
}

async function fetchApplications(): Promise<Application[]> {
  const response = await fetch('/api/applications');
  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }
  const data = await response.json();
  return data.applications;
}

export default function ApplicationsPage() {
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
    refetchInterval: 5 * 60 * 1000,
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Submitted':
        return 'bg-blue-500';
      case 'Interviewing':
        return 'bg-purple-500';
      case 'Offer':
        return 'bg-green-500';
      case 'Rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Failed to load applications</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-sm text-muted-foreground">
            {applications.length} applications tracked
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No applications yet</p>
            </CardContent>
          </Card>
        ) : (
          applications.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{app.title}</CardTitle>
                  <Badge className={getStageColor(app.stage)}>
                    {app.stage}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span>{app.method}</span>
                  </div>
                  {app.appliedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Applied</span>
                      <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}

