import { iptvDataService } from '@/lib/iptv-data-service';
import { useCallback, useEffect, useState } from 'react';
import type { Movie } from '@/types/iptv';

interface UseMoviesOptions {
  categoryId?: string;
  autoFetch?: boolean;
}

interface UseMoviesReturn {
  movies: Movie[];
  isLoading: boolean;
  error: string | null;
  fetchMovies: (
    fetchOptions?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<Movie[]>;
}

export const useMovies = (options: UseMoviesOptions = {}): UseMoviesReturn => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(
    async (
      fetchOptions?: { categoryId?: string; page?: number; limit?: number },
      forceRefresh = false
    ): Promise<Movie[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedMovies = await iptvDataService.getMovies(
          fetchOptions,
          forceRefresh
        );

        setMovies(fetchedMovies);
        setIsLoading(false);
        return fetchedMovies;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch movies';
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    []
  );

  // Auto fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch) {
      fetchMovies({ categoryId: options.categoryId });
    }
  }, [options.autoFetch, options.categoryId, fetchMovies]);

  return {
    movies,
    isLoading,
    error,
    fetchMovies
  };
};
