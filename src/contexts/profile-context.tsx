'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useIPTVStore } from '@/lib/store';
import { ProfileAccount } from '@/types/iptv';

interface ProfileContextType {
  profiles: ProfileAccount[];
  currentProfile: ProfileAccount | null;
  currentProfileId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasProfiles: boolean;
  initializeProfiles: () => Promise<void>;
  setCurrentProfile: (profileId: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    profiles,
    currentProfileId,
    isLoading,
    isAuthenticated,
    loadProfiles,
    loadSettings,
    setCurrentProfile: setCurrentProfileStore,
    setAuthenticated,
    setConfig,
    setUserProfile,
    setServerInfo,
    checkContentDownloaded
  } = useIPTVStore();

  // Initialize profiles on mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeProfiles();
    }
  }, [isInitialized, isLoading]);

  // Handle profile-based routing
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const isProfileRoute =
      pathname.startsWith('/dashboard/') && pathname.split('/').length > 2;
    const isProfilesPage = pathname === '/dashboard/profiles';

    // Se não tem perfis, redirecionar para página de perfis
    if (profiles.length === 0 && !isProfilesPage) {
      router.push('/dashboard/profiles');
      return;
    }

    // Se está em uma rota de perfil mas não tem perfil selecionado
    if (isProfileRoute && !currentProfileId && profiles.length > 0) {
      // Tentar usar o perfil ativo
      const activeProfile = profiles.find((p) => p.isActive);
      if (activeProfile) {
        setCurrentProfileStore(activeProfile.id);
      } else {
        // Se não tem perfil ativo, redirecionar para página de perfis
        router.push('/dashboard/profiles');
      }
    }
  }, [isInitialized, isLoading, profiles, currentProfileId, pathname, router]);

  const initializeProfiles = async () => {
    try {
      // Load profiles and settings from IndexedDB
      await Promise.all([loadProfiles(), loadSettings()]);

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize profiles:', error);
    }
  };

  const setCurrentProfile = async (profileId: string) => {
    try {
      await setCurrentProfileStore(profileId);

      // Initialize data for the selected profile
      const profile = profiles.find((p) => p.id === profileId);
      if (profile) {
        setConfig(profile.config);
        setAuthenticated(true);

        // Load profile data
        if (profile.userProfile) {
          setUserProfile(profile.userProfile);
        }
        if (profile.serverInfo) {
          setServerInfo(profile.serverInfo);
        }

        // Check download status
        await checkContentDownloaded();
      }
    } catch (error) {
      console.error('Failed to set current profile:', error);
    }
  };

  const currentProfile =
    profiles.find((p) => p.id === currentProfileId) || null;
  const hasProfiles = profiles.length > 0;

  const value: ProfileContextType = {
    profiles,
    currentProfile,
    currentProfileId,
    isLoading: isLoading || !isInitialized,
    isAuthenticated,
    hasProfiles,
    initializeProfiles,
    setCurrentProfile
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
