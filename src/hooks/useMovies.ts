import { iptvDataService } from '@/lib/iptv-data-service';
import { useIPTVStore } from '@/lib/store';
import { useCallback, useEffect } from 'react';

interface UseMoviesOptions {
  categoryId?: string;
  autoFetch?: boolean;
}

export const useMovies = (options: UseMoviesOptions = {}) => {
  const { movies, isLoading, error, setMovies, setLoading, setError } =
    useIPTVStore((state) => ({
      movies: state.movies,
      isLoading: state.isLoading,
      error: state.error,
      setMovies: state.setMovies,
      setLoading: state.setLoading,
      setError: state.setError
    }));

  const fetchMovies = useCallback(
    async (
      fetchOptions?: { categoryId?: string; page?: number; limit?: number },
      forceRefresh = false
    ) => {
      try {
        setLoading(true);
        setError(null);

        const fetchedMovies = await iptvDataService.getMovies(
          fetchOptions,
          forceRefresh
        );
        await setMovies(fetchedMovies);

        setLoading(false);
        return fetchedMovies;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch movies';
        setError(errorMessage);
        setLoading(false);
        throw err;
      }
    },
    [setMovies, setLoading, setError]
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
