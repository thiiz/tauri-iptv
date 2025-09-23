import type {
  AppSettings,
  ProfileAccount,
  ServerInfo,
  UserProfile,
  XtreamConfig
} from '@/types/iptv';
import { create } from 'zustand';
import { indexedDBService } from '../indexeddb-service';
import { iptvDataService } from '../iptv-data-service';
import { profileServiceIndexedDB } from '../profile-service-indexeddb';

interface ProfileStore {
  // Profile Management
  profiles: ProfileAccount[];
  currentProfileId: string | null;

  // Configuration (derived from current profile)
  config: XtreamConfig | null;
  isAuthenticated: boolean;

  // User & Server Info
  userProfile: UserProfile | null;
  serverInfo: ServerInfo | null;

  // User Data
  settings: AppSettings;

  // Loading state
  isLoading: boolean;

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
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  clearData: () => Promise<void>;
  setIsLoading: (isLoading: boolean) => void;

  // Async data loading actions
  loadProfiles: () => Promise<void>;
  loadSettings: () => Promise<void>;

  // Async API fetching actions
  fetchUserProfile: (forceRefresh?: boolean) => Promise<void>;
  fetchServerInfo: (forceRefresh?: boolean) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>()((set, get) => ({
  // Initial state
  profiles: [],
  currentProfileId: null,
  config: null,
  isAuthenticated: false,
  userProfile: null,
  serverInfo: null,
  isLoading: false,
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
  setProfiles: async (profiles) => {
    set({ profiles });
    // Save to IndexedDB
    for (const profile of profiles) {
      await profileServiceIndexedDB.saveProfile(profile);
    }
  },

  addProfile: async (profile) => {
    const { profiles } = get();
    const newProfiles = [...profiles, profile];
    set({ profiles: newProfiles });
    await profileServiceIndexedDB.saveProfile(profile);
  },

  updateProfile: async (profileId, updates) => {
    const { profiles } = get();
    const updatedProfiles = profiles.map((p) =>
      p.id === profileId ? { ...p, ...updates } : p
    );
    set({ profiles: updatedProfiles });

    const updatedProfile = updatedProfiles.find((p) => p.id === profileId);
    if (updatedProfile) {
      await profileServiceIndexedDB.saveProfile(updatedProfile);
    }
  },

  deleteProfile: async (profileId) => {
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

    await profileServiceIndexedDB.deleteProfile(profileId);
  },

  setCurrentProfile: async (profileId) => {
    if (!profileId) return undefined;
    console.log('ProfileStore: Setting current profile:', profileId);
    const profile = await profileServiceIndexedDB.getProfile(profileId);
    console.log(
      'ProfileStore: Retrieved profile from IndexedDB:',
      profile?.name
    );
    if (profile) {
      await profileServiceIndexedDB.setActiveProfile(profileId);
      console.log('ProfileStore: Initializing IPTV service with profile...');
      await iptvDataService.initializeWithProfile(profile);
      console.log('ProfileStore: IPTV service initialized');

      set({
        currentProfileId: profileId,
        config: profile.config,
        isAuthenticated: true,
        userProfile: profile.userProfile || null,
        serverInfo: profile.serverInfo || null
      });

      // Update last used
      await profileServiceIndexedDB.updateProfileLastUsed(profileId);
      console.log('ProfileStore: Profile setup completed');
    } else {
      console.warn('ProfileStore: Profile not found in IndexedDB');
    }
  },

  getCurrentProfile: async () => {
    const { currentProfileId } = get();
    if (currentProfileId) {
      return await profileServiceIndexedDB.getProfile(currentProfileId);
    }
    return null;
  },

  setConfig: (config) => set({ config }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setUserProfile: async (profile) => {
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

  setServerInfo: async (info) => {
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

  updateSettings: async (newSettings) => {
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

  setIsLoading: (isLoading) => set({ isLoading }),

  // Async actions for loading data from IndexedDB
  loadProfiles: async () => {
    try {
      const profiles = await profileServiceIndexedDB.getProfiles();
      set({ profiles });

      // Set active profile if exists
      const activeProfile = profiles.find((p) => p.isActive);
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
}));
