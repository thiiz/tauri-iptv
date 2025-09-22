import type {
  AppSettings,
  Category,
  Channel,
  Movie,
  ProfileAccount,
  ServerInfo,
  Show,
  UserProfile,
  XtreamConfig
} from '@/types/iptv';
import { create } from 'zustand';
import { indexedDBService } from './indexeddb-service';
import { iptvDataService } from './iptv-data-service';
import { profileServiceIndexedDB } from './profile-service-indexeddb';
import { useProfileContentStore } from './stores/ProfileContentStore';

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

  // UI State
  currentView: 'dashboard' | 'channels' | 'movies' | 'shows' | 'settings';
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
  setCurrentView: (
    view: 'dashboard' | 'channels' | 'movies' | 'shows' | 'settings'
  ) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentStream: (stream: IPTVStore['currentStream']) => void;
  setPlaying: (playing: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  clearData: () => Promise<void>;

  // Async data loading actions
  loadProfiles: () => Promise<void>;
  loadSettings: () => Promise<void>;

  // Async API fetching actions
  fetchUserProfile: (forceRefresh?: boolean) => Promise<void>;
  fetchServerInfo: (forceRefresh?: boolean) => Promise<void>;

  // Download actions
  downloadChannels: () => Promise<void>;
  downloadMovies: () => Promise<void>;
  downloadShows: () => Promise<void>;
  downloadAllContent: () => Promise<void>;
  checkContentDownloaded: () => Promise<void>;

  // Content getters (delegados para ProfileContentStore)
  getChannels: () => Channel[];
  getMovies: () => Movie[];
  getShows: () => Show[];
  getChannelCategories: () => Category[];
  getMovieCategories: () => Category[];
  getShowCategories: () => Category[];
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
  settings: {
    theme: 'system' as const,
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

    // Limpa o conteúdo do perfil deletado
    if (profileId === currentProfileId) {
      useProfileContentStore.getState().clearProfileContent();
    }
  },

  setCurrentProfile: async (profileId: string | null) => {
    if (!profileId) return;

    console.log('Setting current profile:', profileId);
    const profile = await profileServiceIndexedDB.getProfile(profileId);

    if (profile) {
      await profileServiceIndexedDB.setActiveProfile(profileId);
      console.log('Initializing IPTV service with profile...');
      await iptvDataService.initializeWithProfile(profile);
      console.log('IPTV service initialized');

      set({
        currentProfileId: profileId,
        config: profile.config,
        isAuthenticated: true,
        userProfile: profile.userProfile || null,
        serverInfo: profile.serverInfo || null
      });

      // Carrega o conteúdo do perfil
      await useProfileContentStore.getState().loadProfileContent(profileId);

      // Update last used
      await profileServiceIndexedDB.updateProfileLastUsed(profileId);
      console.log('Profile setup completed');
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
    useProfileContentStore.getState().clearProfileContent();
    await indexedDBService.clearAllData();
  },

  setIsLoading: (isLoading: boolean) => set({ isLoading }),

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

        // Carrega conteúdo do perfil ativo
        await useProfileContentStore
          .getState()
          .loadProfileContent(activeProfile.id);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
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

// UI Slice
const uiSlice = (set: any, get: any) => ({
  currentView: 'dashboard' as const,
  selectedCategory: null as string | null,
  isLoading: false,
  error: null as string | null,

  setCurrentView: (
    view: 'dashboard' | 'channels' | 'movies' | 'shows' | 'settings'
  ) => {
    set({ currentView: view });
  },

  setSelectedCategory: (categoryId: string | null) => {
    set({ selectedCategory: categoryId });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setCurrentStream: (stream: any) => {
    set({ currentStream: stream });
  },

  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  }
});

// Download Slice
const downloadSlice = (set: any, get: any) => ({
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

  downloadChannels: async () => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;

    set({
      downloadProgress: {
        ...get().downloadProgress,
        channels: { isDownloading: true, progress: 0, total: 0 }
      }
    });

    try {
      const contentStore = useProfileContentStore.getState();
      await contentStore.fetchChannels(currentProfileId, {}, true);

      set({
        contentDownloaded: { ...get().contentDownloaded, channels: true },
        downloadProgress: {
          ...get().downloadProgress,
          channels: { isDownloading: false, progress: 100, total: 100 }
        }
      });
    } catch (error) {
      console.error('Failed to download channels:', error);
      set({
        downloadProgress: {
          ...get().downloadProgress,
          channels: { isDownloading: false, progress: 0, total: 0 }
        }
      });
    }
  },

  downloadMovies: async () => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;

    set({
      downloadProgress: {
        ...get().downloadProgress,
        movies: { isDownloading: true, progress: 0, total: 0 }
      }
    });

    try {
      const contentStore = useProfileContentStore.getState();
      await contentStore.fetchMovies(currentProfileId, {}, true);

      set({
        contentDownloaded: { ...get().contentDownloaded, movies: true },
        downloadProgress: {
          ...get().downloadProgress,
          movies: { isDownloading: false, progress: 100, total: 100 }
        }
      });
    } catch (error) {
      console.error('Failed to download movies:', error);
      set({
        downloadProgress: {
          ...get().downloadProgress,
          movies: { isDownloading: false, progress: 0, total: 0 }
        }
      });
    }
  },

  downloadShows: async () => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;

    set({
      downloadProgress: {
        ...get().downloadProgress,
        shows: { isDownloading: true, progress: 0, total: 0 }
      }
    });

    try {
      const contentStore = useProfileContentStore.getState();
      await contentStore.fetchShows(currentProfileId, {}, true);

      set({
        contentDownloaded: { ...get().contentDownloaded, shows: true },
        downloadProgress: {
          ...get().downloadProgress,
          shows: { isDownloading: false, progress: 100, total: 100 }
        }
      });
    } catch (error) {
      console.error('Failed to download shows:', error);
      set({
        downloadProgress: {
          ...get().downloadProgress,
          shows: { isDownloading: false, progress: 0, total: 0 }
        }
      });
    }
  },

  downloadAllContent: async () => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;

    set({ isLoading: true });

    try {
      const contentStore = useProfileContentStore.getState();
      await contentStore.fetchAllContent(currentProfileId, true);

      set({
        contentDownloaded: { channels: true, movies: true, shows: true },
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to download all content:', error);
      set({ isLoading: false, error: 'Failed to download content' });
    }
  },

  checkContentDownloaded: async () => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;

    try {
      const hasChannels = await indexedDBService.hasChannels(currentProfileId);
      const hasMovies = await indexedDBService.hasMovies(currentProfileId);
      const hasShows = await indexedDBService.hasShows(currentProfileId);

      set({
        contentDownloaded: {
          channels: hasChannels,
          movies: hasMovies,
          shows: hasShows
        }
      });
    } catch (error) {
      console.error('Failed to check content download status:', error);
    }
  }
});

// Player Slice
const playerSlice = (set: any, get: any) => ({
  currentStream: null,
  isPlaying: false,

  setCurrentStream: (stream: any) => {
    set({ currentStream: stream });
  },

  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  }
});

// Content getters - delegam para ProfileContentStore
const contentGetters = (set: any, get: any) => ({
  getChannels: () => {
    return useProfileContentStore.getState().channels;
  },

  getMovies: () => {
    return useProfileContentStore.getState().movies;
  },

  getShows: () => {
    return useProfileContentStore.getState().shows;
  },

  getChannelCategories: () => {
    return useProfileContentStore.getState().channelCategories;
  },

  getMovieCategories: () => {
    return useProfileContentStore.getState().movieCategories;
  },

  getShowCategories: () => {
    return useProfileContentStore.getState().showCategories;
  }
});

// Create the store
export const useIPTVStore = create<IPTVStore>()((set, get) => ({
  // Combine all slices
  ...profileSlice(set, get),
  ...uiSlice(set, get),
  ...downloadSlice(set, get),
  ...playerSlice(set, get),
  ...contentGetters(set, get)
}));
