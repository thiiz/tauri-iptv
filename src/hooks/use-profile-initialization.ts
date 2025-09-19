'use client';

import { useIPTVStore } from '@/lib/store';
import { useEffect } from 'react';

export function useProfileInitialization() {
  const {
    profiles,
    loadProfiles,
    loadFavorites,
    loadWatchHistory,
    loadSettings,
    currentProfileId,
    setCurrentProfile,
    checkContentDownloaded
  } = useIPTVStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load all data from IndexedDB
        await Promise.all([
          loadProfiles(),
          loadFavorites(),
          loadWatchHistory(),
          loadSettings()
        ]);

        // If we have profiles but no current profile, and there's an active one, set it
        if (profiles.length > 0 && !currentProfileId) {
          const activeProfile = profiles.find((p) => p.isActive);
          if (activeProfile) {
            await setCurrentProfile(activeProfile.id);
            // Check download status for the active profile
            await checkContentDownloaded();
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    // Only initialize if we don't have profiles loaded yet
    if (profiles.length === 0) {
      initializeApp();
    }
  }, [
    profiles.length,
    loadProfiles,
    loadFavorites,
    loadWatchHistory,
    loadSettings,
    currentProfileId,
    setCurrentProfile,
    profiles
  ]);
}
