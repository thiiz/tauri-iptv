import type { Category, Channel, Movie, Show } from '@/types/iptv';
import { create } from 'zustand';
import { iptvDataService } from '../iptv-data-service';

interface ContentStore {
  // Categories
  channelCategories: Category[];
  movieCategories: Category[];
  showCategories: Category[];

  // Content
  channels: Channel[];
  movies: Movie[];
  shows: Show[];

  // Actions
  setChannelCategories: (categories: Category[]) => Promise<void>;
  setMovieCategories: (categories: Category[]) => Promise<void>;
  setShowCategories: (categories: Category[]) => Promise<void>;
  setChannels: (channels: Channel[]) => Promise<void>;
  setMovies: (movies: Movie[]) => Promise<void>;
  setShows: (shows: Show[]) => Promise<void>;

  // Async data loading actions
  loadChannelCategories: () => Promise<void>;
  loadMovieCategories: () => Promise<void>;
  loadShowCategories: () => Promise<void>;
  loadChannels: (categoryId?: string) => Promise<void>;
  loadMovies: (categoryId?: string) => Promise<void>;
  loadShows: (categoryId?: string) => Promise<void>;

  // Async API fetching actions
  fetchChannelCategories: (forceRefresh?: boolean) => Promise<void>;
  fetchMovieCategories: (forceRefresh?: boolean) => Promise<void>;
  fetchShowCategories: (forceRefresh?: boolean) => Promise<void>;
  fetchChannels: (
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchMovies: (
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchShows: (
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh?: boolean
  ) => Promise<void>;
}

export const useContentStore = create<ContentStore>()((set, get) => ({
  // Initial state
  channelCategories: [],
  movieCategories: [],
  showCategories: [],
  channels: [],
  movies: [],
  shows: [],

  // Actions
  setChannelCategories: async (categories) => {
    set({ channelCategories: categories });
    // Assume currentProfileId is available, but since this is separate store,
    // we need to get it from somewhere. For now, assume it's passed or from context.
    // Actually, since stores are separate, we might need to sync via events or something.
    // For simplicity, assume we have a way to get currentProfileId.
    // In composition, we can access other stores.
    // For now, placeholder.
    // const { currentProfileId } = useProfileStore.getState();
    // if (currentProfileId) {
    //   await indexedDBService.saveCategories('channel', categories, currentProfileId);
    // }
  },

  setMovieCategories: async (categories) => {
    set({ movieCategories: categories });
  },

  setShowCategories: async (categories) => {
    set({ showCategories: categories });
  },

  setChannels: async (channels) => {
    set({ channels });
  },

  setMovies: async (movies) => {
    set({ movies });
  },

  setShows: async (shows) => {
    set({ shows });
  },

  loadChannelCategories: async () => {
    try {
      // const { currentProfileId } = useProfileStore.getState();
      // if (!currentProfileId) return;
      // const categories = await indexedDBService.getCategories('channel', currentProfileId);
      // set({ channelCategories: categories });
    } catch (error) {
      console.error('Failed to load channel categories:', error);
    }
  },

  loadMovieCategories: async () => {
    try {
      // Similar
    } catch (error) {
      console.error('Failed to load movie categories:', error);
    }
  },

  loadShowCategories: async () => {
    try {
      // Similar
    } catch (error) {
      console.error('Failed to load show categories:', error);
    }
  },

  loadChannels: async (categoryId?: string) => {
    try {
      // const { currentProfileId } = useProfileStore.getState();
      // if (!currentProfileId) return;
      // const channels = await indexedDBService.getChannels(categoryId, currentProfileId);
      // set({ channels });
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  },

  loadMovies: async (categoryId?: string) => {
    try {
      // Similar
    } catch (error) {
      console.error('Failed to load movies:', error);
    }
  },

  loadShows: async (categoryId?: string) => {
    try {
      // Similar
    } catch (error) {
      console.error('Failed to load shows:', error);
    }
  },

  // Async actions for fetching from API
  fetchChannelCategories: async (forceRefresh = false) => {
    try {
      const categories =
        await iptvDataService.getChannelCategories(forceRefresh);
      set({ channelCategories: categories });
    } catch (error) {
      console.error('Failed to fetch channel categories:', error);
      throw error;
    }
  },

  fetchMovieCategories: async (forceRefresh = false) => {
    try {
      const categories = await iptvDataService.getMovieCategories(forceRefresh);
      set({ movieCategories: categories });
    } catch (error) {
      console.error('Failed to fetch movie categories:', error);
      throw error;
    }
  },

  fetchShowCategories: async (forceRefresh = false) => {
    try {
      const categories = await iptvDataService.getShowCategories(forceRefresh);
      set({ showCategories: categories });
    } catch (error) {
      console.error('Failed to fetch show categories:', error);
      throw error;
    }
  },

  fetchChannels: async (
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh = false
  ) => {
    try {
      const channels = await iptvDataService.getChannels(options, forceRefresh);
      set({ channels });
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      throw error;
    }
  },

  fetchMovies: async (
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh = false
  ) => {
    try {
      const movies = await iptvDataService.getMovies(options, forceRefresh);
      set({ movies });
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      throw error;
    }
  },

  fetchShows: async (
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh = false
  ) => {
    try {
      const shows = await iptvDataService.getShows(options, forceRefresh);
      set({ shows });
    } catch (error) {
      console.error('Failed to fetch shows:', error);
      throw error;
    }
  }
}));
