'use client';

import { ContentView } from '@/components/dashboard/content-view';
import { Badge } from '@/components/ui/badge';
import { iptvDataService } from '@/lib/iptv-data-service';
import { useIPTVStore } from '@/lib/store';
import type { Movie } from '@/types/iptv';
import { Film } from 'lucide-react';
import { toast } from 'sonner';

export function MoviesView() {
  const {
    movieCategories,
    movies,
    loadMovies,
    loadMovieCategories,
    selectedCategory,
    setSelectedCategory,
    contentDownloaded
  } = useIPTVStore();

  const handlePlayMovie = (movie: Movie) => {
    try {
      const streamUrl = iptvDataService.generateStreamUrl({
        type: 'movie',
        streamId: movie.id,
        extension: movie.containerExtension || 'mp4'
      });

      toast.success(`Playing: ${movie.name}`);
      // Note: Stream URL could be opened in a new tab or player here
    } catch (error) {
      toast.error('Failed to play movie. Please try again.');
    }
  };

  const renderMovieItem = (movie: Movie) => (
    <>
      <div className='mb-3'>
        {movie.streamIcon ? (
          <img
            src={movie.streamIcon}
            alt={movie.name}
            className='h-32 w-full rounded object-cover'
          />
        ) : (
          <div className='bg-muted flex h-32 w-full items-center justify-center rounded'>
            <Film className='text-muted-foreground h-8 w-8' />
          </div>
        )}
      </div>

      <div className='text-center'>
        <h3 className='mb-1 truncate text-sm font-semibold'>{movie.name}</h3>
        <div className='mb-3 flex items-center justify-center gap-2'>
          {movie.year && (
            <Badge variant='secondary' className='text-xs'>
              {movie.year}
            </Badge>
          )}
          {movie.rating && (
            <Badge variant='outline' className='text-xs'>
              ⭐ {movie.rating}
            </Badge>
          )}
        </div>
      </div>
    </>
  );

  return (
    <ContentView
      title='Movies'
      searchPlaceholder='Search movies...'
      emptyState={{
        icon: Film,
        title: 'No movies available',
        description: 'Download content from the home page to view movies'
      }}
      categories={movieCategories}
      items={movies}
      loadCategories={loadMovieCategories}
      loadItems={(category) => loadMovies(category || undefined)}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      renderItem={renderMovieItem}
      handleAction={handlePlayMovie}
      actionLabel='Watch'
      contentDownloaded={contentDownloaded.movies}
    />
  );
}
