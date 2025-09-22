'use client';

import { useMovies } from '@/hooks/useMovies';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface MoviesContentProps {
  categoryId?: string;
  autoFetch?: boolean;
}

export function MoviesContent({
  categoryId,
  autoFetch = false
}: MoviesContentProps) {
  const { movies, isLoading, error } = useMovies({ categoryId, autoFetch });

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
      <h1 className='mb-6 text-3xl font-bold'>Movies</h1>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
        {movies.map((movie) => (
          <div
            key={movie.id}
            className='bg-card overflow-hidden rounded-lg border transition-shadow hover:shadow-md'
          >
            <div className='bg-muted flex aspect-video items-center justify-center'>
              <Play className='text-muted-foreground h-12 w-12' />
            </div>
            <div className='p-3'>
              <h3 className='mb-1 truncate text-sm font-semibold'>
                {movie.name}
              </h3>
              <p className='text-muted-foreground mb-2 text-xs'>
                {movie.year || 'Unknown'} • ⭐ {movie.rating || 'N/A'}
              </p>
              <Button size='sm' className='w-full'>
                <Play className='mr-1 h-3 w-3' />
                Play
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
