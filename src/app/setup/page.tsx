'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useIPTVStore } from '@/lib/store';
import { Loader2, Tv } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function SetupPage() {
  const router = useRouter();
  const { profiles, currentProfileId } = useIPTVStore();

  // Redirect to profiles if we have profiles but no active one
  // Or redirect to dashboard if we have an active profile
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentProfileId) {
        router.push('/dashboard');
      } else {
        router.push('/dashboard/profiles');
      }
    }, 1000); // Add a small delay to prevent immediate redirects

    return () => clearTimeout(timer);
  }, [currentProfileId, profiles, router]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900'>
            <Tv className='h-6 w-6 text-blue-600 dark:text-blue-400' />
          </div>
          <CardTitle className='text-2xl'>IPTV Desktop</CardTitle>
          <CardDescription>
            Redirecting to profile management...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
