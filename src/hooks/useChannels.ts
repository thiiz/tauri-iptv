import { iptvDataService } from '@/lib/iptv-data-service';
import { useCallback, useEffect, useState } from 'react';
import type { Channel } from '@/types/iptv';

interface UseChannelsOptions {
  categoryId?: string;
  autoFetch?: boolean;
}

interface UseChannelsReturn {
  channels: Channel[];
  isLoading: boolean;
  error: string | null;
  fetchChannels: (
    fetchOptions?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<Channel[]>;
}

export const useChannels = (
  options: UseChannelsOptions = {}
): UseChannelsReturn => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(
    async (
      fetchOptions?: { categoryId?: string; page?: number; limit?: number },
      forceRefresh = false
    ): Promise<Channel[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedChannels = await iptvDataService.getChannels(
          fetchOptions,
          forceRefresh
        );

        setChannels(fetchedChannels);
        setIsLoading(false);
        return fetchedChannels;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch channels';
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
