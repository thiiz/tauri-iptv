import { iptvDataService } from '@/lib/iptv-data-service';
import type { Channel, Movie, Show } from '@/types/iptv';
import { useCallback, useEffect, useState } from 'react';

type ContentType = 'channels' | 'movies' | 'series';

type ContentTypeMap = {
  channels: Channel;
  movies: Movie;
  series: Show;
};

interface UseContentOptions {
  categoryId?: string;
  autoFetch?: boolean;
  localOnly?: boolean;
}

interface UseContentReturn<T> {
  content: T[];
  isLoading: boolean;
  error: string | null;
  fetchContent: (
    fetchOptions?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<T[]>;
}

export const useContent = <T extends ContentType>(
  contentType: T,
  options: UseContentOptions = {}
): UseContentReturn<ContentTypeMap[T]> => {
  const [content, setContent] = useState<ContentTypeMap[T][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(
    async (
      fetchOptions?: { categoryId?: string; page?: number; limit?: number },
      forceRefresh = false
    ): Promise<ContentTypeMap[T][]> => {
      try {
        setIsLoading(true);
        setError(null);

        let fetchedContent: ContentTypeMap[T][];

        switch (contentType) {
          case 'channels':
            fetchedContent = (await iptvDataService.getChannels(
              fetchOptions,
              forceRefresh,
              options.localOnly
            )) as ContentTypeMap[T][];
            break;
          case 'movies':
            fetchedContent = (await iptvDataService.getMovies(
              fetchOptions,
              forceRefresh,
              options.localOnly
            )) as ContentTypeMap[T][];
            break;
          case 'series':
            fetchedContent = (await iptvDataService.getShows(
              fetchOptions,
              forceRefresh,
              options.localOnly
            )) as ContentTypeMap[T][];
            break;
          default:
            throw new Error(`Unsupported content type: ${contentType}`);
        }

        setContent(fetchedContent);
        setIsLoading(false);
        return fetchedContent;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to fetch ${contentType}`;
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    [contentType, options.localOnly]
  );

  // Auto fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch) {
      fetchContent({ categoryId: options.categoryId }).catch((err) => {
        // Error already handled in fetchContent
      });
    }
  }, [options.autoFetch, options.categoryId, fetchContent]);

  return {
    content,
    isLoading,
    error,
    fetchContent
  };
};
