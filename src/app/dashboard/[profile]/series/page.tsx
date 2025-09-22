'use client';

import { SeriesContent } from '@/components/dashboard/series-content';
import { useProfileValidation } from '@/hooks/use-profile-validation';

export default function SeriesPage() {
  const { isLoading, currentProfile } = useProfileValidation();

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  if (!currentProfile) {
    return null;
  }

  return <SeriesContent categoryId={undefined} autoFetch={true} />;
}
