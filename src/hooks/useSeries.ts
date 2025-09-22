import { iptvDataService } from '@/lib/iptv-data-service';
import { useCallback, useEffect, useState } from 'react';
import type { Show } from '@/types/iptv';

interface UseSeriesOptions {
  categoryId?: string;
  autoFetch?: boolean;
  localOnly?: boolean;
}

interface UseSeriesReturn {
  shows: Show[];
  isLoading: boolean;
  error: string | null;
  fetchSeries: (
    fetchOptions?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<Show[]>;
}

export const useSeries = (options: UseSeriesOptions = {}): UseSeriesReturn => {
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = useCallback(
    async (
      fetchOptions?: { categoryId?: string; page?: number; limit?: number },
      forceRefresh = false
    ): Promise<Show[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedSeries = await iptvDataService.getShows(
          fetchOptions,
          forceRefresh,
          options.localOnly
        );

        // Update the shows state with fetched data
        setShows(fetchedSeries);

        setIsLoading(false);
        return fetchedSeries;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch series';
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    [options.localOnly]
  );

  // Auto fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch) {
      console.log('Auto-fetching series...', {
        categoryId: options.categoryId
      });
      fetchSeries({ categoryId: options.categoryId }).catch((err) => {
        console.error('Failed to auto-fetch series:', err);
      });
    }
  }, [options.autoFetch, options.categoryId, fetchSeries]);

  return {
    shows,
    isLoading,
    error,
    fetchSeries
  };
};
