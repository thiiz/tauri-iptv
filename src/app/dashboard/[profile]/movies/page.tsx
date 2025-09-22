'use client';

import { MoviesContent } from '@/components/dashboard/movies-content';
import { useProfileValidation } from '@/hooks/use-profile-validation';

export default function MoviesPage() {
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

  return <MoviesContent categoryId={undefined} autoFetch={true} />;
}
