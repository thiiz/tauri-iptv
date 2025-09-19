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
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  currentView: 'dashboard' | 'channels' | 'movies' | 'shows' | 'settings';
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;

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
  setProfiles: (profiles: ProfileAccount[]) => void;
  addProfile: (profile: ProfileAccount) => void;
  updateProfile: (profileId: string, updates: Partial<ProfileAccount>) => void;
  deleteProfile: (profileId: string) => void;
  setCurrentProfile: (profileId: string | null) => void;
  getCurrentProfile: () => ProfileAccount | null;
  setConfig: (config: XtreamConfig) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setUserProfile: (profile: UserProfile) => void;
  setServerInfo: (info: ServerInfo) => void;
  setChannelCategories: (categories: Category[]) => void;
  setMovieCategories: (categories: Category[]) => void;
  setShowCategories: (categories: Category[]) => void;
  setChannels: (channels: Channel[]) => void;
  setMovies: (movies: Movie[]) => void;
  setShows: (shows: Show[]) => void;
  setCurrentView: (
    view: 'dashboard' | 'channels' | 'movies' | 'shows' | 'settings'
  ) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentStream: (stream: IPTVStore['currentStream']) => void;
  setPlaying: (playing: boolean) => void;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  addToHistory: (item: WatchHistory) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearData: () => void;
}

export const useIPTVStore = create<IPTVStore>()(
  persist(
    (set, get) => ({
      // Initial state
      profiles: [],
      currentProfileId: null,
      config: null,
      isAuthenticated: false,
      userProfile: null,
      serverInfo: null,
      channelCategories: [],
      movieCategories: [],
      showCategories: [],
      channels: [],
      movies: [],
      shows: [],
      currentView: 'dashboard',
      selectedCategory: null,
      isLoading: false,
      error: null,
      currentStream: null,
      isPlaying: false,
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

      // Actions
      setProfiles: (profiles) => set({ profiles }),

      addProfile: (profile) => {
        const { profiles } = get();
        set({ profiles: [...profiles, profile] });
      },

      updateProfile: (profileId, updates) => {
        const { profiles } = get();
        const updatedProfiles = profiles.map((p) =>
          p.id === profileId ? { ...p, ...updates } : p
        );
        set({ profiles: updatedProfiles });
      },

      deleteProfile: (profileId) => {
        const { profiles, currentProfileId } = get();
        const updatedProfiles = profiles.filter((p) => p.id !== profileId);
        const newCurrentProfileId =
          currentProfileId === profileId ? null : currentProfileId;
        set({
          profiles: updatedProfiles,
          currentProfileId: newCurrentProfileId,
          config: newCurrentProfileId ? get().config : null,
          isAuthenticated: newCurrentProfileId ? get().isAuthenticated : false
        });
      },

      setCurrentProfile: (profileId) => {
        const { profiles } = get();
        const profile = profiles.find((p) => p.id === profileId);
        set({
          currentProfileId: profileId,
          config: profile?.config || null,
          isAuthenticated: !!profile,
          userProfile: profile?.userProfile || null,
          serverInfo: profile?.serverInfo || null
        });
      },

      getCurrentProfile: () => {
        const { profiles, currentProfileId } = get();
        return profiles.find((p) => p.id === currentProfileId) || null;
      },

      setConfig: (config) => set({ config }),
      setAuthenticated: (authenticated) =>
        set({ isAuthenticated: authenticated }),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setServerInfo: (info) => set({ serverInfo: info }),
      setChannelCategories: (categories) =>
        set({ channelCategories: categories }),
      setMovieCategories: (categories) => set({ movieCategories: categories }),
      setShowCategories: (categories) => set({ showCategories: categories }),
      setChannels: (channels) => set({ channels }),
      setMovies: (movies) => set({ movies }),
      setShows: (shows) => set({ shows }),
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedCategory: (categoryId) =>
        set({ selectedCategory: categoryId }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setCurrentStream: (stream) => set({ currentStream: stream }),
      setPlaying: (playing) => set({ isPlaying: playing }),

      addFavorite: (item) => {
        const { favorites } = get();
        if (
          !favorites.find((fav) => fav.id === item.id && fav.type === item.type)
        ) {
          set({ favorites: [...favorites, item] });
        }
      },

      removeFavorite: (id) => {
        const { favorites } = get();
        set({ favorites: favorites.filter((fav) => fav.id !== id) });
      },

      addToHistory: (item) => {
        const { watchHistory } = get();
        const existingIndex = watchHistory.findIndex(
          (h) => h.id === item.id && h.type === item.type
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
      },

      updateSettings: (newSettings) => {
        const { settings } = get();
        set({ settings: { ...settings, ...newSettings } });
      },

      clearData: () =>
        set({
          currentProfileId: null,
          config: null,
          isAuthenticated: false,
          userProfile: null,
          serverInfo: null,
          channelCategories: [],
          movieCategories: [],
          showCategories: [],
          channels: [],
          movies: [],
          shows: [],
          currentStream: null,
          isPlaying: false,
          error: null
        })
    }),
    {
      name: 'iptv-store',
      partialize: (state) => ({
        profiles: state.profiles,
        currentProfileId: state.currentProfileId,
        config: state.config,
        favorites: state.favorites,
        watchHistory: state.watchHistory,
        settings: state.settings
      })
    }
  )
);
