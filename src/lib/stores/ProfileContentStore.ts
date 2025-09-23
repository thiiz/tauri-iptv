import { create } from 'zustand';
import { indexedDBService } from '@/lib/indexeddb-service';
import { iptvDataService } from '@/lib/iptv-data-service';
import { Category, Channel, Movie, Show } from '@/types/iptv';

interface ProfileContentState {
  // Conteúdo do perfil atual
  channels: Channel[];
  movies: Movie[];
  shows: Show[];
  channelCategories: Category[];
  movieCategories: Category[];
  showCategories: Category[];

  // Estado de carregamento
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;

  // Cache por perfil (para performance)
  contentCache: Map<string, ProfileContent>;
}

interface ProfileContent {
  channels: Channel[];
  movies: Movie[];
  shows: Show[];
  channelCategories: Category[];
  movieCategories: Category[];
  showCategories: Category[];
  lastFetch: number;
}

interface ProfileContentActions {
  // Carregamento de conteúdo
  loadProfileContent: (profileId: string) => Promise<void>;
  clearProfileContent: () => void;

  // Fetch da API
  fetchAllContent: (profileId: string, forceRefresh?: boolean) => Promise<void>;
  fetchChannels: (
    profileId: string,
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchMovies: (
    profileId: string,
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchShows: (
    profileId: string,
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchChannelCategories: (
    profileId: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchMovieCategories: (
    profileId: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchShowCategories: (
    profileId: string,
    forceRefresh?: boolean
  ) => Promise<void>;

  // Ações de conteúdo
  setChannels: (channels: Channel[]) => void;
  setMovies: (movies: Movie[]) => void;
  setShows: (shows: Show[]) => void;
  setChannelCategories: (categories: Category[]) => void;
  setMovieCategories: (categories: Category[]) => void;
  setShowCategories: (categories: Category[]) => void;

  // Estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Cache
  getCachedContent: (profileId: string) => ProfileContent | null;
  cacheContent: (profileId: string, content: ProfileContent) => void;
  getCurrentContent: () => ProfileContent;

  // Helpers
  checkContentExists: (
    profileId: string,
    type: 'channels' | 'movies' | 'shows'
  ) => Promise<boolean>;
  loadChannels: (profileId: string) => Promise<Channel[]>;
  loadMovies: (profileId: string) => Promise<Movie[]>;
  loadShows: (profileId: string) => Promise<Show[]>;
  getChannels: (profileId: string) => Channel[];
  getMovies: (profileId: string) => Movie[];
  getShows: (profileId: string) => Show[];
  getChannelCategories: (profileId: string) => Category[];
  getMovieCategories: (profileId: string) => Category[];
  getShowCategories: (profileId: string) => Category[];
}

export type ProfileContentStore = ProfileContentState & ProfileContentActions;

const initialState: ProfileContentState = {
  channels: [],
  movies: [],
  shows: [],
  channelCategories: [],
  movieCategories: [],
  showCategories: [],
  isLoading: false,
  error: null,
  lastFetch: null,
  contentCache: new Map()
};

export const useProfileContentStore = create<ProfileContentStore>()(
  (set, get) => ({
    ...initialState,

    // Carrega todo o conteúdo do perfil do IndexedDB
    loadProfileContent: async (profileId: string) => {
      if (!profileId) return;

      set({ isLoading: true, error: null });

      try {
        // Primeiro tenta o cache
        const cached = get().getCachedContent(profileId);
        if (cached) {
          set({
            channels: cached.channels,
            movies: cached.movies,
            shows: cached.shows,
            channelCategories: cached.channelCategories,
            movieCategories: cached.movieCategories,
            showCategories: cached.showCategories,
            lastFetch: cached.lastFetch,
            isLoading: false
          });
          return;
        }

        // Se não tem cache, carrega do IndexedDB
        const [
          channels,
          movies,
          shows,
          channelCategories,
          movieCategories,
          showCategories
        ] = await Promise.all([
          indexedDBService.getChannels(undefined, profileId),
          indexedDBService.getMovies(undefined, profileId),
          indexedDBService.getShows(undefined, profileId),
          indexedDBService.getCategories('channel', profileId),
          indexedDBService.getCategories('movie', profileId),
          indexedDBService.getCategories('show', profileId)
        ]);

        const now = Date.now();
        set({
          channels,
          movies,
          shows,
          channelCategories,
          movieCategories,
          showCategories,
          lastFetch: now,
          isLoading: false
        });

        // Cache o conteúdo
        get().cacheContent(profileId, {
          channels,
          movies,
          shows,
          channelCategories,
          movieCategories,
          showCategories,
          lastFetch: now
        });
      } catch (error) {
        console.error('Failed to load profile content:', error);
        set({ error: 'Failed to load profile content', isLoading: false });
      }
    },

    // Limpa o conteúdo atual
    clearProfileContent: () => {
      set({
        channels: [],
        movies: [],
        shows: [],
        channelCategories: [],
        movieCategories: [],
        showCategories: [],
        lastFetch: null,
        error: null
      });
    },

    // Fetch todo o conteúdo da API
    fetchAllContent: async (profileId: string, forceRefresh = false) => {
      if (!profileId) return;

      set({ isLoading: true, error: null });

      try {
        const [
          channels,
          movies,
          shows,
          channelCategories,
          movieCategories,
          showCategories
        ] = await Promise.all([
          iptvDataService.getChannels({}, forceRefresh),
          iptvDataService.getMovies({}, forceRefresh),
          iptvDataService.getShows({}, forceRefresh),
          iptvDataService.getChannelCategories(forceRefresh),
          iptvDataService.getMovieCategories(forceRefresh),
          iptvDataService.getShowCategories(forceRefresh)
        ]);

        // Salva no IndexedDB
        await Promise.all([
          indexedDBService.saveChannels(channels, profileId),
          indexedDBService.saveMovies(movies, profileId),
          indexedDBService.saveShows(shows, profileId),
          indexedDBService.saveCategories(
            'channel',
            channelCategories,
            profileId
          ),
          indexedDBService.saveCategories('movie', movieCategories, profileId),
          indexedDBService.saveCategories('show', showCategories, profileId)
        ]);

        const now = Date.now();
        set({
          channels,
          movies,
          shows,
          channelCategories,
          movieCategories,
          showCategories,
          lastFetch: now,
          isLoading: false
        });

        // Atualiza o cache
        get().cacheContent(profileId, {
          channels,
          movies,
          shows,
          channelCategories,
          movieCategories,
          showCategories,
          lastFetch: now
        });
      } catch (error) {
        console.error('Failed to fetch all content:', error);
        set({ error: 'Failed to fetch content', isLoading: false });
        throw error;
      }
    },

    // Fetch específico de canais
    fetchChannels: async (
      profileId: string,
      options = {},
      forceRefresh = false
    ) => {
      if (!profileId) return;

      set({ isLoading: true, error: null });

      try {
        const channels = await iptvDataService.getChannels(
          options,
          forceRefresh
        );
        await indexedDBService.saveChannels(channels, profileId);

        set({ channels, lastFetch: Date.now(), isLoading: false });

        // Atualiza cache
        const current =
          get().getCachedContent(profileId) || get().getCurrentContent();
        get().cacheContent(profileId, {
          ...current,
          channels,
          lastFetch: Date.now()
        });
      } catch (error) {
        console.error('Failed to fetch channels:', error);
        set({ error: 'Failed to fetch channels', isLoading: false });
        throw error;
      }
    },

    // Fetch específico de filmes
    fetchMovies: async (
      profileId: string,
      options = {},
      forceRefresh = false
    ) => {
      if (!profileId) return;

      set({ isLoading: true, error: null });

      try {
        const movies = await iptvDataService.getMovies(options, forceRefresh);
        await indexedDBService.saveMovies(movies, profileId);

        set({ movies, lastFetch: Date.now(), isLoading: false });

        // Atualiza cache
        const current =
          get().getCachedContent(profileId) || get().getCurrentContent();
        get().cacheContent(profileId, {
          ...current,
          movies,
          lastFetch: Date.now()
        });
      } catch (error) {
        console.error('Failed to fetch movies:', error);
        set({ error: 'Failed to fetch movies', isLoading: false });
        throw error;
      }
    },

    // Fetch específico de séries
    fetchShows: async (
      profileId: string,
      options = {},
      forceRefresh = false
    ) => {
      if (!profileId) return;

      set({ isLoading: true, error: null });

      try {
        const shows = await iptvDataService.getShows(options, forceRefresh);
        await indexedDBService.saveShows(shows, profileId);

        set({ shows, lastFetch: Date.now(), isLoading: false });

        // Atualiza cache
        const current =
          get().getCachedContent(profileId) || get().getCurrentContent();
        get().cacheContent(profileId, {
          ...current,
          shows,
          lastFetch: Date.now()
        });
      } catch (error) {
        console.error('Failed to fetch shows:', error);
        set({ error: 'Failed to fetch shows', isLoading: false });
        throw error;
      }
    },

    // Fetch de categorias
    fetchChannelCategories: async (profileId: string, forceRefresh = false) => {
      if (!profileId) return;

      try {
        const categories =
          await iptvDataService.getChannelCategories(forceRefresh);
        await indexedDBService.saveCategories('channel', categories, profileId);

        set({ channelCategories: categories });

        // Atualiza cache
        const current =
          get().getCachedContent(profileId) || get().getCurrentContent();
        get().cacheContent(profileId, {
          ...current,
          channelCategories: categories
        });
      } catch (error) {
        console.error('Failed to fetch channel categories:', error);
        throw error;
      }
    },

    fetchMovieCategories: async (profileId: string, forceRefresh = false) => {
      if (!profileId) return;

      try {
        const categories =
          await iptvDataService.getMovieCategories(forceRefresh);
        await indexedDBService.saveCategories('movie', categories, profileId);

        set({ movieCategories: categories });

        // Atualiza cache
        const current =
          get().getCachedContent(profileId) || get().getCurrentContent();
        get().cacheContent(profileId, {
          ...current,
          movieCategories: categories
        });
      } catch (error) {
        console.error('Failed to fetch movie categories:', error);
        throw error;
      }
    },

    fetchShowCategories: async (profileId: string, forceRefresh = false) => {
      if (!profileId) return;

      try {
        const categories =
          await iptvDataService.getShowCategories(forceRefresh);
        await indexedDBService.saveCategories('show', categories, profileId);

        set({ showCategories: categories });

        // Atualiza cache
        const current =
          get().getCachedContent(profileId) || get().getCurrentContent();
        get().cacheContent(profileId, {
          ...current,
          showCategories: categories
        });
      } catch (error) {
        console.error('Failed to fetch show categories:', error);
        throw error;
      }
    },

    // Setters simples
    setChannels: (channels: Channel[]) => set({ channels }),
    setMovies: (movies: Movie[]) => set({ movies }),
    setShows: (shows: Show[]) => set({ shows }),
    setChannelCategories: (channelCategories: Category[]) =>
      set({ channelCategories }),
    setMovieCategories: (movieCategories: Category[]) =>
      set({ movieCategories }),
    setShowCategories: (showCategories: Category[]) => set({ showCategories }),

    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),

    // Cache methods
    getCachedContent: (profileId: string): ProfileContent | null => {
      return get().contentCache.get(profileId) || null;
    },

    cacheContent: (profileId: string, content: ProfileContent) => {
      const cache = new Map(get().contentCache);
      cache.set(profileId, content);
      set({ contentCache: cache });
    },

    // Helper para obter conteúdo atual
    getCurrentContent: (): ProfileContent => {
      const state = get();
      return {
        channels: state.channels,
        movies: state.movies,
        shows: state.shows,
        channelCategories: state.channelCategories,
        movieCategories: state.movieCategories,
        showCategories: state.showCategories,
        lastFetch: state.lastFetch || Date.now()
      };
    },

    checkContentExists: async (
      profileId: string,
      type: 'channels' | 'movies' | 'shows'
    ): Promise<boolean> => {
      try {
        switch (type) {
          case 'channels':
            return await indexedDBService.hasChannels(profileId);
          case 'movies':
            return await indexedDBService.hasMovies(profileId);
          case 'shows':
            return await indexedDBService.hasShows(profileId);
          default:
            return false;
        }
      } catch (error) {
        console.error(
          `Error checking ${type} existence for profile ${profileId}:`,
          error
        );
        return false;
      }
    },

    // Métodos de conveniência para carregamento
    loadChannels: async (profileId: string) => {
      await get().loadProfileContent(profileId);
      return get().channels;
    },

    loadMovies: async (profileId: string) => {
      await get().loadProfileContent(profileId);
      return get().movies;
    },

    loadShows: async (profileId: string) => {
      await get().loadProfileContent(profileId);
      return get().shows;
    },

    // Métodos getters para conteúdo específico
    getChannels: (profileId: string) => {
      return get().channels;
    },

    getMovies: (profileId: string) => {
      return get().movies;
    },

    getShows: (profileId: string) => {
      return get().shows;
    },

    getChannelCategories: (profileId: string) => {
      return get().channelCategories;
    },

    getMovieCategories: (profileId: string) => {
      return get().movieCategories;
    },

    getShowCategories: (profileId: string) => {
      return get().showCategories;
    }
  })
);
