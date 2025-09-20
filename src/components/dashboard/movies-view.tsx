'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { iptvDataService } from '@/lib/iptv-data-service';
import { useIPTVStore } from '@/lib/store';
import type { Movie } from '@/types/iptv';
import { Film, Grid3X3, List, Play, Search, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function MoviesView() {
  const {
    movieCategories,
    movies,
    loadMovies,
    loadMovieCategories,
    fetchMovies,
    selectedCategory,
    setSelectedCategory,
    favorites,
    addFavorite,
    removeFavorite,
    addToHistory,
    contentDownloaded
  } = useIPTVStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load categories and movies from IndexedDB
        await loadMovieCategories();
        await loadMovies(selectedCategory || undefined);
      } catch (error) {
        toast.error('Failed to load movies. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedCategory, loadMovies, loadMovieCategories]);

  useEffect(() => {
    let filtered = movies;
    if (searchQuery) {
      filtered = filtered.filter((movie) =>
        movie.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredMovies(filtered);
  }, [movies, searchQuery]);

  const handlePlayMovie = (movie: Movie) => {
    try {
      const streamUrl = iptvDataService.generateStreamUrl({
        type: 'movie',
        streamId: movie.id,
        extension: movie.containerExtension || 'mp4'
      });

      addToHistory({
        id: movie.id,
        type: 'movie',
        name: movie.name,
        streamIcon: movie.streamIcon,
        watchedAt: new Date().toISOString()
      });

      toast.success(`Playing: ${movie.name}`);
      // Note: Stream URL could be opened in a new tab or player here
    } catch (error) {
      toast.error('Failed to play movie. Please try again.');
    }
  };

  const handleToggleFavorite = (movie: Movie) => {
    const isFavorite = favorites.some(
      (fav) => fav.id === movie.id && fav.type === 'movie'
    );

    if (isFavorite) {
      removeFavorite(movie.id);
    } else {
      addFavorite({
        id: movie.id,
        type: 'movie',
        name: movie.name,
        streamIcon: movie.streamIcon,
        addedAt: new Date().toISOString()
      });
    }
  };

  const isFavorite = (movieId: string) => {
    return favorites.some((fav) => fav.id === movieId && fav.type === 'movie');
  };

  return (
    <div className='flex flex-1 flex-col'>
      <div className='border-b p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Movies</h1>
            <p className='text-muted-foreground'>
              {filteredMovies.length} movies available
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('list')}
            >
              <List className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <div className='mt-4 flex gap-4'>
          <div className='relative max-w-sm flex-1'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder='Search movies...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8'
            />
          </div>

          <Select
            value={selectedCategory || 'all'}
            onValueChange={(value) =>
              setSelectedCategory(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Categoria' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {movieCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className='flex-1'>
        <div className='p-6'>
          {isLoading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'space-y-2'
              }
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <Card
                  key={i}
                  className='group cursor-pointer transition-all hover:shadow-md'
                >
                  <CardContent className='p-4'>
                    <div className='mb-3'>
                      <Skeleton className='h-32 w-full rounded object-cover' />
                    </div>
                    <div className='text-center'>
                      <Skeleton className='mx-auto mb-1 h-4 w-3/4' />
                      <div className='mb-3 flex items-center justify-center gap-2'>
                        <Skeleton className='h-3 w-8' />
                        <Skeleton className='h-3 w-12' />
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Skeleton className='h-8 flex-1' />
                      <Skeleton className='h-8 w-8' />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className='py-12 text-center'>
              <Film className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>
                {searchQuery ? 'No movies found' : 'No movies available'}
              </h3>
              <p className='text-muted-foreground'>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Download content from the home page to view movies'}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'space-y-2'
              }
            >
              {filteredMovies.map((movie) => (
                <Card
                  key={movie.id}
                  className='group cursor-pointer transition-all hover:shadow-md'
                >
                  <CardContent className='p-4'>
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
                      <h3 className='mb-1 truncate text-sm font-semibold'>
                        {movie.name}
                      </h3>
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

                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        onClick={() => handlePlayMovie(movie)}
                        className='flex-1'
                      >
                        <Play className='mr-1 h-4 w-4' />
                        Watch
                      </Button>

                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleToggleFavorite(movie)}
                        className={
                          isFavorite(movie.id) ? 'text-yellow-600' : ''
                        }
                      >
                        {isFavorite(movie.id) ? (
                          <Star className='h-4 w-4 fill-current' />
                        ) : (
                          <Star className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
