'use client';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useContent } from '@/hooks/useContent';
import { useIPTVStore } from '@/lib/store';
import { Tv, Tv2 } from 'lucide-react';

interface SeriesContentProps {
  categoryId?: string;
  autoFetch?: boolean;
}

export function SeriesContent({
  categoryId,
  autoFetch = false
}: SeriesContentProps) {
  const { contentDownloaded } = useIPTVStore();
  const {
    content: series,
    isLoading,
    error,
    fetchContent: fetchSeries
  } = useContent('series', {
    categoryId,
    autoFetch: autoFetch && contentDownloaded.shows, // Only auto-fetch if content is downloaded
    localOnly: true
  });

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

  // Show message if content hasn't been downloaded
  if (!contentDownloaded.shows) {
    return (
      <div className='p-6'>
        <div className='rounded-lg bg-blue-100 p-4 text-center text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
          <Tv2 className='mx-auto mb-2 h-8 w-8' />
          <p className='font-medium'>Séries não disponíveis</p>
          <p className='text-sm'>Baixe as séries para visualizar o conteúdo</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <h1 className='mb-6 text-3xl font-bold'>Series</h1>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
        {series.map((seriesItem) => (
          <div
            key={seriesItem.id}
            className='bg-card overflow-hidden rounded-lg border transition-shadow hover:shadow-md'
          >
            <div className='bg-muted flex aspect-video items-center justify-center'>
              <Tv className='text-muted-foreground h-12 w-12' />
            </div>
            <div className='p-3'>
              <h3 className='mb-1 truncate text-sm font-semibold'>
                {seriesItem.name}
              </h3>
              <p className='text-muted-foreground mb-2 text-xs'>
                {seriesItem.year || 'Unknown'} • ⭐ {seriesItem.rating || 'N/A'}
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
