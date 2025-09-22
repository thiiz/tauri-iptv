'use client';

import { useSeries } from '@/hooks/useSeries';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Tv } from 'lucide-react';

interface SeriesContentProps {
  categoryId?: string;
  autoFetch?: boolean;
}

export function SeriesContent({
  categoryId,
  autoFetch = false
}: SeriesContentProps) {
  const { shows, isLoading, error } = useSeries({ categoryId, autoFetch });

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-destructive/10 text-destructive rounded-lg p-4'>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <h1 className='mb-6 text-3xl font-bold'>Series</h1>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
        {shows.map((show) => (
          <div
            key={show.id}
            className='bg-card overflow-hidden rounded-lg border transition-shadow hover:shadow-md'
          >
            <div className='bg-muted flex aspect-video items-center justify-center'>
              <Tv className='text-muted-foreground h-12 w-12' />
            </div>
            <div className='p-3'>
              <h3 className='mb-1 truncate text-sm font-semibold'>
                {show.name}
              </h3>
              <p className='text-muted-foreground mb-2 text-xs'>
                {show.year || 'Unknown'} • ⭐ {show.rating || 'N/A'}
              </p>
              <Button size='sm' className='w-full'>
                View Episodes
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
