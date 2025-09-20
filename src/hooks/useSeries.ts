import { iptvDataService } from '@/lib/iptv-data-service';
import { useIPTVStore } from '@/lib/store';
import { useCallback, useEffect } from 'react';

interface UseSeriesOptions {
  categoryId?: string;
  autoFetch?: boolean;
}

export const useSeries = (options: UseSeriesOptions = {}) => {
  const { shows, isLoading, error, setShows, setLoading, setError } =
    useIPTVStore((state) => ({
      shows: state.shows,
      isLoading: state.isLoading,
      error: state.error,
      setShows: state.setShows,
      setLoading: state.setLoading,
      setError: state.setError
    }));

  const fetchSeries = useCallback(
    async (
      fetchOptions?: { categoryId?: string; page?: number; limit?: number },
      forceRefresh = false
    ) => {
      try {
        setLoading(true);
        setError(null);

        const fetchedShows = await iptvDataService.getShows(
          fetchOptions,
          forceRefresh
        );
        await setShows(fetchedShows);

        setLoading(false);
        return fetchedShows;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch series';
        setError(errorMessage);
        setLoading(false);
        throw err;
      }
    },
    [setShows, setLoading, setError]
  );

  // Auto fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch) {
      fetchSeries({ categoryId: options.categoryId });
    }
  }, [options.autoFetch, options.categoryId, fetchSeries]);

  return {
    shows,
    isLoading,
    error,
    fetchSeries
  };
};
