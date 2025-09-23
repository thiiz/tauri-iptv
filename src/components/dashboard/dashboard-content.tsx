'use client';

import { DashboardOverview } from './dashboard-overview';
import { useProfile } from '@/contexts/profile-context';
import { Loader2 } from 'lucide-react';

export function DashboardContent() {
  const { isLoading, currentProfile } = useProfile();

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground'>No profile selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 overflow-hidden'>
      <DashboardOverview />
    </div>
  );
}
