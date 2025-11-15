/**
 * Settings Page
 * Configure job preferences and notification settings
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomNavigation } from '@/components/navigation';

export default function SettingsPage() {
  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Job Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Settings coming soon...
            </p>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}

