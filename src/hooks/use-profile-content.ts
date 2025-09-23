import { useEffect, useState } from 'react';
import { useIPTVStore } from '@/lib/store';
import { useProfileContentStore } from '@/lib/stores/ProfileContentStore';
import { Channel, Movie, Show, Category } from '@/types/iptv';

interface UseProfileContentReturn {
  channels: Channel[];
  movies: Movie[];
  shows: Show[];
  channelCategories: Category[];
  movieCategories: Category[];
  showCategories: Category[];
  hasContent: {
    channels: boolean;
    movies: boolean;
    shows: boolean;
  };
  loading: boolean;
  error: string | null;
  loadChannels: () => Promise<void>;
  loadMovies: () => Promise<void>;
  loadShows: () => Promise<void>;
  refreshContent: () => Promise<void>;
}

export function useProfileContent(): UseProfileContentReturn {
  const { currentProfileId } = useIPTVStore();
  const contentStore = useProfileContentStore();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [channelCategories, setChannelCategories] = useState<Category[]>([]);
  const [movieCategories, setMovieCategories] = useState<Category[]>([]);
  const [showCategories, setShowCategories] = useState<Category[]>([]);
  const [hasContent, setHasContent] = useState({
    channels: false,
    movies: false,
    shows: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar conteúdo quando o perfil mudar
  useEffect(() => {
    if (currentProfileId) {
      loadContentForProfile();
    }
  }, [currentProfileId]);

  const loadContentForProfile = async () => {
    if (!currentProfileId) return;

    setLoading(true);
    setError(null);

    try {
      // Verificar se o conteúdo existe
      const [hasChannels, hasMovies, hasShows] = await Promise.all([
        contentStore.checkContentExists(currentProfileId, 'channels'),
        contentStore.checkContentExists(currentProfileId, 'movies'),
        contentStore.checkContentExists(currentProfileId, 'shows')
      ]);

      setHasContent({
        channels: hasChannels,
        movies: hasMovies,
        shows: hasShows
      });

      // Carregar conteúdo existente
      if (hasChannels) {
        const [loadedChannels, loadedChannelCategories] = await Promise.all([
          contentStore.getChannels(currentProfileId),
          contentStore.getChannelCategories(currentProfileId)
        ]);
        setChannels(loadedChannels);
        setChannelCategories(loadedChannelCategories);
      }

      if (hasMovies) {
        const [loadedMovies, loadedMovieCategories] = await Promise.all([
          contentStore.getMovies(currentProfileId),
          contentStore.getMovieCategories(currentProfileId)
        ]);
        setMovies(loadedMovies);
        setMovieCategories(loadedMovieCategories);
      }

      if (hasShows) {
        const [loadedShows, loadedShowCategories] = await Promise.all([
          contentStore.getShows(currentProfileId),
          contentStore.getShowCategories(currentProfileId)
        ]);
        setShows(loadedShows);
        setShowCategories(loadedShowCategories);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar conteúdo'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    if (!currentProfileId) return;

    setLoading(true);
    setError(null);

    try {
      await contentStore.loadChannels(currentProfileId);
      const [loadedChannels, loadedCategories] = await Promise.all([
        contentStore.getChannels(currentProfileId),
        contentStore.getChannelCategories(currentProfileId)
      ]);
      setChannels(loadedChannels);
      setChannelCategories(loadedCategories);
      setHasContent((prev) => ({ ...prev, channels: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar canais');
    } finally {
      setLoading(false);
    }
  };

  const loadMovies = async () => {
    if (!currentProfileId) return;

    setLoading(true);
    setError(null);

    try {
      await contentStore.loadMovies(currentProfileId);
      const [loadedMovies, loadedCategories] = await Promise.all([
        contentStore.getMovies(currentProfileId),
        contentStore.getMovieCategories(currentProfileId)
      ]);
      setMovies(loadedMovies);
      setMovieCategories(loadedCategories);
      setHasContent((prev) => ({ ...prev, movies: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar filmes');
    } finally {
      setLoading(false);
    }
  };

  const loadShows = async () => {
    if (!currentProfileId) return;

    setLoading(true);
    setError(null);

    try {
      await contentStore.loadShows(currentProfileId);
      const [loadedShows, loadedCategories] = await Promise.all([
        contentStore.getShows(currentProfileId),
        contentStore.getShowCategories(currentProfileId)
      ]);
      setShows(loadedShows);
      setShowCategories(loadedCategories);
      setHasContent((prev) => ({ ...prev, shows: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar séries');
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = async () => {
    await loadContentForProfile();
  };

  return {
    channels,
    movies,
    shows,
    channelCategories,
    movieCategories,
    showCategories,
    hasContent,
    loading,
    error,
    loadChannels,
    loadMovies,
    loadShows,
    refreshContent
  };
}
