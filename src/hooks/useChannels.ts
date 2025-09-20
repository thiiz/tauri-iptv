import { iptvDataService } from '@/lib/iptv-data-service';
import { useIPTVStore } from '@/lib/store';
import { useCallback, useEffect } from 'react';

interface UseChannelsOptions {
  categoryId?: string;
  autoFetch?: boolean;
}

export const useChannels = (options: UseChannelsOptions = {}) => {
  const { channels, isLoading, error, setChannels, setLoading, setError } =
    useIPTVStore((state) => ({
      channels: state.channels,
      isLoading: state.isLoading,
      error: state.error,
      setChannels: state.setChannels,
      setLoading: state.setLoading,
      setError: state.setError
    }));

  const fetchChannels = useCallback(
    async (
      fetchOptions?: { categoryId?: string; page?: number; limit?: number },
      forceRefresh = false
    ) => {
      try {
        setLoading(true);
        setError(null);

        const fetchedChannels = await iptvDataService.getChannels(
          fetchOptions,
          forceRefresh
        );
        await setChannels(fetchedChannels);

        setLoading(false);
        return fetchedChannels;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch channels';
        setError(errorMessage);
        setLoading(false);
        throw err;
      }
    },
    [setChannels, setLoading, setError]
  );

  // Auto fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch) {
      fetchChannels({ categoryId: options.categoryId });
    }
  }, [options.autoFetch, options.categoryId, fetchChannels]);

  return {
    channels,
    isLoading,
    error,
    fetchChannels
  };
};
