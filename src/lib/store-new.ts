import type {
  AppSettings,
  Category,
  Channel,
  FavoriteItem,
  Movie,
  ProfileAccount,
  ServerInfo,
  Show,
  UserProfile,
  WatchHistory,
  XtreamConfig
} from '@/types/iptv';
import { combine, create } from 'zustand';
import { indexedDBService } from './indexeddb-service';
import { iptvDataService } from './iptv-data-service';
import { profileServiceIndexedDB } from './profile-service-indexeddb';

interface IPTVStore {
  // Profile Management
  profiles: ProfileAccount[];
  currentProfileId: string | null;

  // Configuration (derived from current profile)
  config: XtreamConfig | null;
  isAuthenticated: boolean;

  // User & Server Info
  userProfile: UserProfile | null;
  serverInfo: ServerInfo | null;

  // Categories
  channelCategories: Category[];
  movieCategories: Category[];
  showCategories: Category[];

  // Content
  channels: Channel[];
  movies: Movie[];
  shows: Show[];

  // UI State
  currentView:
    | 'dashboard'
    | 'channels'
    | 'movies'
    | 'shows'
    | 'favorites'
    | 'history'
    | 'settings';
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;

  // Download State
  downloadProgress: {
    channels: { isDownloading: boolean; progress: number; total: number };
    movies: { isDownloading: boolean; progress: number; total: number };
    shows: { isDownloading: boolean; progress: number; total: number };
  };
  contentDownloaded: {
    channels: boolean;
    movies: boolean;
    shows: boolean;
  };

  // Player State
  currentStream: {
    type: 'channel' | 'movie' | 'episode';
    id: string;
    name: string;
    url: string;
  } | null;
  isPlaying: boolean;

  // User Data
  favorites: FavoriteItem[];
  watchHistory: WatchHistory[];
  settings: AppSettings;

  // Actions
  setProfiles: (profiles: ProfileAccount[]) => Promise<void>;
  addProfile: (profile: ProfileAccount) => Promise<void>;
  updateProfile: (
    profileId: string,
    updates: Partial<ProfileAccount>
  ) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  setCurrentProfile: (profileId: string | null) => Promise<void>;
  getCurrentProfile: () => Promise<ProfileAccount | null>;
  setConfig: (config: XtreamConfig) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  setServerInfo: (info: ServerInfo) => Promise<void>;
  setChannelCategories: (categories: Category[]) => Promise<void>;
  setMovieCategories: (categories: Category[]) => Promise<void>;
  setShowCategories: (categories: Category[]) => Promise<void>;
  setChannels: (channels: Channel[]) => Promise<void>;
  setMovies: (movies: Movie[]) => Promise<void>;
  setShows: (shows: Show[]) => Promise<void>;
  setCurrentView: (
    view:
      | 'dashboard'
      | 'channels'
      | 'movies'
      | 'shows'
      | 'favorites'
      | 'history'
      | 'settings'
  ) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentStream: (stream: IPTVStore['currentStream']) => void;
  setPlaying: (playing: boolean) => void;
  addFavorite: (item: FavoriteItem) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  addToHistory: (item: WatchHistory) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  clearData: () => Promise<void>;

  // Async data loading actions
  loadProfiles: () => Promise<void>;
  loadFavorites: () => Promise<void>;
  loadWatchHistory: () => Promise<void>;
  loadSettings: () => Promise<void>;
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
  fetchUserProfile: (forceRefresh?: boolean) => Promise<void>;
  fetchServerInfo: (forceRefresh?: boolean) => Promise<void>;

  // Download actions
  downloadChannels: () => Promise<void>;
  downloadMovies: () => Promise<void>;
  downloadShows: () => Promise<void>;
  downloadAllContent: () => Promise<void>;
  checkContentDownloaded: () => Promise<void>;
}

// Profile Slice
const profileSlice = (set: any, get: any) => ({
  // Profile state
  profiles: [],
  currentProfileId: null,
  config: null,
  isAuthenticated: false,
  userProfile: null,
  serverInfo: null,
  favorites: [],
  watchHistory: [],
  settings: {
    theme: 'system',
    autoplay: false,
    defaultQuality: 'm3u8',
    alwaysOnTop: false,
    minimizeToTray: true,
    startWithSystem: false,
    enableNotifications: true,
    cacheSize: 500
  },

  // Profile actions
  setProfiles: async (profiles: ProfileAccount[]) => {
    set({ profiles });
    for (const profile of profiles) {
      await profileServiceIndexedDB.saveProfile(profile);
    }
  },

  addProfile: async (profile: ProfileAccount) => {
    const { profiles } = get();
    const newProfiles = [...profiles, profile];
    set({ profiles: newProfiles });
    await profileServiceIndexedDB.saveProfile(profile);
  },

  updateProfile: async (
    profileId: string,
    updates: Partial<ProfileAccount>
  ) => {
    const { profiles } = get();
    const updatedProfiles = profiles.map((p: ProfileAccount) =>
      p.id === profileId ? { ...p, ...updates } : p
    );
    set({ profiles: updatedProfiles });

    const updatedProfile = updatedProfiles.find(
      (p: ProfileAccount) => p.id === profileId
    );
    if (updatedProfile) {
      await profileServiceIndexedDB.saveProfile(updatedProfile);
    }
  },

  deleteProfile: async (profileId: string) => {
    const { profiles, currentProfileId } = get();
    const updatedProfiles = profiles.filter(
      (p: ProfileAccount) => p.id !== profileId
    );
    const newCurrentProfileId =
      currentProfileId === profileId ? null : currentProfileId;

    set({
      profiles: updatedProfiles,
      currentProfileId: newCurrentProfileId,
      config: newCurrentProfileId ? get().config : null,
      isAuthenticated: newCurrentProfileId ? get().isAuthenticated : false
    });

    await profileServiceIndexedDB.deleteProfile(profileId);
  },

  setCurrentProfile: async (profileId: string | null) => {
    if (!profileId) return;
    const profile = await profileServiceIndexedDB.getProfile(profileId);
    if (profile) {
      await profileServiceIndexedDB.setActiveProfile(profileId);
      await iptvDataService.initializeWithProfile(profile);

      set({
        currentProfileId: profileId,
        config: profile.config,
        isAuthenticated: true,
        userProfile: profile.userProfile || null,
        serverInfo: profile.serverInfo || null
      });

      await profileServiceIndexedDB.updateProfileLastUsed(profileId);
    }
  },

  getCurrentProfile: async () => {
    const { currentProfileId } = get();
    if (currentProfileId) {
      return await profileServiceIndexedDB.getProfile(currentProfileId);
    }
    return null;
  },

  setConfig: (config: XtreamConfig) => set({ config }),
  setAuthenticated: (authenticated: boolean) =>
    set({ isAuthenticated: authenticated }),
  setUserProfile: async (profile: UserProfile) => {
    set({ userProfile: profile });
    const { currentProfileId } = get();
    if (currentProfileId) {
      await profileServiceIndexedDB.updateProfileUserData(
        currentProfileId,
        profile,
        get().serverInfo
      );
    }
  },

  setServerInfo: async (info: ServerInfo) => {
    set({ serverInfo: info });
    const { currentProfileId } = get();
    if (currentProfileId) {
      await profileServiceIndexedDB.updateProfileUserData(
        currentProfileId,
        get().userProfile,
        info
      );
    }
  },

  addFavorite: async (item: FavoriteItem) => {
    const { favorites, currentProfileId } = get();
    if (!currentProfileId) return;
    if (
      !favorites.find(
        (fav: FavoriteItem) => fav.id === item.id && fav.type === item.type
      )
    ) {
      const newFavorites = [...favorites, item];
      set({ favorites: newFavorites });
      await indexedDBService.addFavorite(item, currentProfileId);
    }
  },

  removeFavorite: async (id: string) => {
    const { favorites, currentProfileId } = get();
    if (!currentProfileId) return;
    const newFavorites = favorites.filter((fav: FavoriteItem) => fav.id !== id);
    set({ favorites: newFavorites });
    await indexedDBService.removeFavorite(id, currentProfileId);
  },

  addToHistory: async (item: WatchHistory) => {
    const { watchHistory, currentProfileId } = get();
    if (!currentProfileId) return;
    const existingIndex = watchHistory.findIndex(
      (h: WatchHistory) => h.id === item.id && h.type === item.type
    );

    if (existingIndex >= 0) {
      // Update existing entry
      const updated = [...watchHistory];
      updated[existingIndex] = {
        ...updated[existingIndex],
        watchedAt: item.watchedAt
      };
      set({ watchHistory: updated });
    } else {
      // Add new entry (keep only last 100 items)
      const updated = [item, ...watchHistory].slice(0, 100);
      set({ watchHistory: updated });
    }

    await indexedDBService.addToHistory(item, currentProfileId);
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    const { settings } = get();
    const updatedSettings = { ...settings, ...newSettings };
    set({ settings: updatedSettings });
    await indexedDBService.saveSettings(updatedSettings);
  },

  clearData: async () => {
    set({
      currentProfileId: null,
      config: null,
      isAuthenticated: false,
      userProfile: null,
      serverInfo: null
    });
    await indexedDBService.clearAllData();
  },

  // Async actions for loading data from IndexedDB
  loadProfiles: async () => {
    try {
      const profiles = await profileServiceIndexedDB.getProfiles();
      set({ profiles });

      // Set active profile if exists
      const activeProfile = profiles.find((p: ProfileAccount) => p.isActive);
      if (activeProfile) {
        set({
          currentProfileId: activeProfile.id,
          config: activeProfile.config,
          isAuthenticated: true,
          userProfile: activeProfile.userProfile || null,
          serverInfo: activeProfile.serverInfo || null
        });
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  },

  loadFavorites: async () => {
    try {
      const { currentProfileId } = get();
      if (!currentProfileId) return;
      const favorites = await indexedDBService.getFavorites(currentProfileId);
      set({ favorites });
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  },

  loadWatchHistory: async () => {
    try {
      const { currentProfileId } = get();
      if (!currentProfileId) return;
      const watchHistory =
        await indexedDBService.getWatchHistory(currentProfileId);
      set({ watchHistory });
    } catch (error) {
      console.error('Failed to load watch history:', error);
    }
  },

  loadSettings: async () => {
    try {
      const settings = await indexedDBService.getSettings();
      if (settings) {
        set({ settings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  // Async actions for fetching from API
  fetchUserProfile: async (forceRefresh = false) => {
    try {
      const userProfile = await iptvDataService.getUserProfile(forceRefresh);
      set({ userProfile });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  fetchServerInfo: async (forceRefresh = false) => {
    try {
      const serverInfo = await iptvDataService.getServerInfo(forceRefresh);
      set({ serverInfo });
    } catch (error) {
      console.error('Failed to fetch server info:', error);
      throw error;
    }
  }
});

// Content Slice
const contentSlice = (set: any, get: any) => ({
  // Content state
  channelCategories: [],
  movieCategories: [],
  showCategories: [],
  channels: [],
  movies: [],
  shows: [],

  // Content actions
  setChannelCategories: async (categories: Category[]) => {
    set({ channelCategories: categories });
    const { currentProfileId } = get();
    if (currentProfileId) {
      await indexedDBService.saveCategories(
        'channel',
        categories,
        currentProfileId
      );
    }
  },

  setMovieCategories: async (categories: Category[]) => {
    set({ movieCategories: categories });
    const { currentProfileId } = get();
    if (currentProfileId) {
      await indexedDBService.saveCategories(
        'movie',
        categories,
        currentProfileId
      );
    }
  },

  setShowCategories: async (categories: Category[]) => {
    set({ showCategories: categories });
    const { currentProfileId } = get();
    if (currentProfileId) {
      await indexedDBService.saveCategories(
        'show',
        categories,
        currentProfileId
      );
    }
  },

  setChannels: async (channels: Channel[]) => {
    set({ channels });
    const { currentProfileId } = get();
    if (currentProfileId) {
      await indexedDBService.saveChannels(channels, currentProfileId);
    }
  },

  setMovies: async (movies: Movie[]) => {
    set({ movies });
    const { currentProfileId } = get();
    if (currentProfileId) {
      await indexedDBService.saveMovies(movies, currentProfileId);
    }
  },

  setShows: async (shows: Show[]) => {
    set({ shows });
    const { currentProfileId } = get();
    if (currentProfileId) {
      await indexedDBService.saveShows(shows, currentProfileId);
    }
  },

  loadChannelCategories: async () => {
    try {
      const { currentProfileId } = get();
      if (!currentProfileId) return;

      const categories = await indexedDBService.getCategories(
        'channel',
        currentProfileId
      );

      set({ channelCategories: categories });
    } catch (error) {
      console.error('Failed to load channel categories:', error);
    }
  },

  loadMovieCategories: async () => {
    try {
      const { currentProfileId } = get();
      if (!currentProfileId) return;

      const categories = await indexedDBService.getCategories(
        'movie',
        currentProfileId
      );

      set({ movieCategories: categories });
    } catch (error) {
      console.error('Failed to load movie categories:', error);
    }
  },

  loadShowCategories: async () => {
    try {
      const { currentProfileId } = get();
      if (!currentProfileId) return;

      const categories = await indexedDBService.getCategories(
        'show',
        currentProfileId
      );

      set({ showCategories: categories });
    } catch (error) {
      console.error('Failed to load show categories:', error);
    }
  },

  loadChannels: async (categoryId?: string) => {
    try {
      const { currentProfileId } = get();
      if (!currentProfileId) return;

      const channels = await indexedDBService.getChannels(
        categoryId,
        currentProfileId
      );
      set({ channels });
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  },

  loadMovies: async (categoryId?: string) => {
    try {
      const { currentProfileId } = get();
      if (!currentProfileId) return;

      const movies = await indexedDBService.getMovies(
        categoryId,
        currentProfileId
      );
      set({ movies });
    } catch (error) {
      console.error('Failed to load movies:', error);
    }
  },

  loadShows: async (categoryId?: string) => {
    try {
      const { currentProfileId } = get();
      if (!currentProfileId) return;

      const shows = await indexedDBService.getShows(
        categoryId,
        currentProfileId
      );
      set({ shows });
    } catch (error) {
      console.error('Failed to load shows:', error);
    }
  },

  // Async actions for fetching from API
  fetchChannelCategories: async (forceRefresh = false) => {
    try {
      set({ isLoading: true, error: null });
      const categories =
        await iptvDataService.getChannelCategories(forceRefresh);
      set({ channelCategories: categories, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch channel categories',
        isLoading: false
      });
    }
  },

  fetchMovieCategories: async (forceRefresh = false) => {
    try {
      set({ isLoading: true, error: null });
      const categories = await iptvDataService.getMovieCategories(forceRefresh);
      set({ movieCategories: categories, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch movie categories',
        isLoading: false
      });
    }
  },

  fetchShowCategories: async (forceRefresh = false) => {
    try {
      set({ isLoading: true, error: null });
      const categories = await iptvDataService.getShowCategories(forceRefresh);
      set({ showCategories: categories, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch show categories',
        isLoading: false
      });
    }
  },

  fetchChannels: async (
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh = false
  ) => {
    try {
      set({ isLoading: true, error: null });
      const channels = await iptvDataService.getChannels(options, forceRefresh);
      set({ channels, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch channels',
        isLoading: false
      });
    }
  },

  fetchMovies: async (
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh = false
  ) => {
    try {
      set({ isLoading: true, error: null });
      const movies = await iptvDataService.getMovies(options, forceRefresh);
      set({ movies, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch movies',
        isLoading: false
      });
    }
  },

  fetchShows: async (
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh = false
  ) => {
    try {
      set({ isLoading: true, error: null });
      const shows = await iptvDataService.getShows(options, forceRefresh);
      set({ shows, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch shows',
        isLoading: false
      });
    }
  }
});

// UI Slice
const uiSlice = (set: any) => ({
  // UI state
  currentView: 'dashboard',
  selectedCategory: null,
  isLoading: false,
  error: null,
  currentStream: null,
  isPlaying: false,

  // UI actions
  setCurrentView: (view: string) => set({ currentView: view }),
  setSelectedCategory: (categoryId: string | null) =>
    set({ selectedCategory: categoryId }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setCurrentStream: (stream: any) => set({ currentStream: stream }),
  setPlaying: (playing: boolean) => set({ isPlaying: playing })
});

// Download Slice
const downloadSlice = (set: any, get: any) => ({
  // Download state
  downloadProgress: {
    channels: { isDownloading: false, progress: 0, total: 0 },
    movies: { isDownloading: false, progress: 0, total: 0 },
    shows: { isDownloading: false, progress: 0, total: 0 }
  },
  contentDownloaded: {
    channels: false,
    movies: false,
    shows: false
  },

  // Download actions
  downloadChannels: async () => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;

    set((state: any) => ({
      downloadProgress: {
        ...state.downloadProgress,
        channels: { isDownloading: true, progress: 0, total: 0 }
      }
    }));

    try {
      const categories = await iptvDataService.getChannelCategories(true);
      const allChannels: Channel[] = [];

      for (const category of categories) {
        const channels = await iptvDataService.getChannels(
          { categoryId: category.id },
          true
        );
        allChannels.push(...channels);

        set((state: any) => ({
          downloadProgress: {
            ...state.downloadProgress,
            channels: {
              ...state.downloadProgress.channels,
              progress: allChannels.length,
              total: allChannels.length + 1 // Estimate
            }
          }
        }));
      }

      await indexedDBService.saveCategories(
        'channel',
        categories,
        currentProfileId
      );
      await indexedDBService.downloadChannels(currentProfileId, allChannels);

      set((state: any) => ({
        downloadProgress: {
          ...state.downloadProgress,
          channels: {
            isDownloading: false,
            progress: allChannels.length,
            total: allChannels.length
          }
        },
        contentDownloaded: {
          ...state.contentDownloaded,
          channels: true
        }
      }));
    } catch (error) {
      set((state: any) => ({
        downloadProgress: {
          ...state.downloadProgress,
          channels: { isDownloading: false, progress: 0, total: 0 }
        },
        error:
          error instanceof Error ? error.message : 'Failed to download channels'
      }));
    }
  },

  downloadMovies: async () => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;

    set((state: any) => ({
      downloadProgress: {
        ...state.downloadProgress,
        movies: { isDownloading: true, progress: 0, total: 0 }
      }
    }));

    try {
      const categories = await iptvDataService.getMovieCategories(true);
      const allMovies: Movie[] = [];

      for (const category of categories) {
        const movies = await iptvDataService.getMovies(
          { categoryId: category.id },
          true
        );
        allMovies.push(...movies);

        set((state: any) => ({
          downloadProgress: {
            ...state.downloadProgress,
            movies: {
              ...state.downloadProgress.movies,
              progress: allMovies.length,
              total: allMovies.length + 1
            }
          }
        }));
      }

      await indexedDBService.saveCategories(
        'movie',
        categories,
        currentProfileId
      );
      await indexedDBService.downloadMovies(currentProfileId, allMovies);

      set((state: any) => ({
        downloadProgress: {
          ...state.downloadProgress,
          movies: {
            isDownloading: false,
            progress: allMovies.length,
            total: allMovies.length
          }
        },
        contentDownloaded: {
          ...state.contentDownloaded,
          movies: true
        }
      }));
    } catch (error) {
      set((state: any) => ({
        downloadProgress: {
          ...state.downloadProgress,
          movies: { isDownloading: false, progress: 0, total: 0 }
        },
        error:
          error instanceof Error ? error.message : 'Failed to download movies'
      }));
    }
  },

  downloadShows: async () => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;

    set((state: any) => ({
      downloadProgress: {
        ...state.downloadProgress,
        shows: { isDownloading: true, progress: 0, total: 0 }
      }
    }));

    try {
      const categories = await iptvDataService.getShowCategories(true);
      const allShows: Show[] = [];

      for (const category of categories) {
        const shows = await iptvDataService.getShows(
          { categoryId: category.id },
          true
        );
        allShows.push(...shows);

        set((state: any) => ({
          downloadProgress: {
            ...state.downloadProgress,
            shows: {
              ...state.downloadProgress.shows,
              progress: allShows.length,
              total: allShows.length + 1
            }
          }
        }));
      }

      await indexedDBService.saveCategories(
        'show',
        categories,
        currentProfileId
      );
      await indexedDBService.downloadShows(currentProfileId, allShows);

      set((state: any) => ({
        downloadProgress: {
          ...state.downloadProgress,
          shows: {
            isDownloading: false,
            progress: allShows.length,
            total: allShows.length
          }
        },
        contentDownloaded: {
          ...state.contentDownloaded,
          shows: true
        }
      }));
    } catch (error) {
      set((state: any) => ({
        downloadProgress: {
          ...state.downloadProgress,
          shows: { isDownloading: false, progress: 0, total: 0 }
        },
        error:
          error instanceof Error ? error.message : 'Failed to download shows'
      }));
    }
  },

  downloadAllContent: async () => {
    await Promise.all([
      get().downloadChannels(),
      get().downloadMovies(),
      get().downloadShows()
    ]);
  },

  checkContentDownloaded: async () => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;

    try {
      const status = await indexedDBService.getDownloadStatus(currentProfileId);
      set({ contentDownloaded: status });
    } catch (error) {
      console.error('Failed to check download status:', error);
    }
  }
});

export const useIPTVStore = create<IPTVStore>()(
  combine(profileSlice, combine(contentSlice, combine(uiSlice, downloadSlice)))
);
