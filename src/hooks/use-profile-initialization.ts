'use client';

import { profileService } from '@/lib/profile-service';
import { useIPTVStore } from '@/lib/store';
import { useEffect } from 'react';

export function useProfileInitialization() {
  const { profiles, setProfiles, currentProfileId, setCurrentProfile } =
    useIPTVStore();

  useEffect(() => {
    const initializeProfiles = async () => {
      try {
        const savedProfiles = await profileService.getProfiles();
        setProfiles(savedProfiles);

        // If we have profiles but no current profile, and there's an active one, set it
        if (savedProfiles.length > 0 && !currentProfileId) {
          const activeProfile = savedProfiles.find((p) => p.isActive);
          if (activeProfile) {
            setCurrentProfile(activeProfile.id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize profiles:', error);
      }
    };

    // Only initialize if we don't have profiles loaded yet
    if (profiles.length === 0) {
      initializeProfiles();
    }
  }, [profiles.length, setProfiles, currentProfileId, setCurrentProfile]);
}
