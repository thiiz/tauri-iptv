'use client';

import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useProfileInitialization } from '@/hooks/use-profile-initialization';
import { iptvDataService } from '@/lib/iptv-data-service';
import { useIPTVStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();

  // Initialize profiles on app start
  useProfileInitialization();
  const {
    isAuthenticated,
    config,
    currentProfileId,
    getCurrentProfile,
    setConfig,
    setAuthenticated,
    setUserProfile,
    setServerInfo,
    loadChannelCategories,
    loadMovieCategories,
    loadShowCategories,
    fetchUserProfile,
    fetchServerInfo,
    checkContentDownloaded,
    setLoading,
    setError,
    contentDownloaded
  } = useIPTVStore();

  useEffect(() => {
    // If no profile is selected, redirect to profiles page
    if (!currentProfileId) {
      router.push('/dashboard/profiles');
      return;
    }

    const initializeData = async () => {
      setLoading(true);
      setError(null);

      try {
        const currentProfile = await getCurrentProfile();
        if (!currentProfile) {
          router.push('/dashboard/profiles');
          return;
        }

        // Initialize the service with the current profile
        await iptvDataService.initializeWithProfile(currentProfile);

        // Set the store state
        setConfig(currentProfile.config);
        setAuthenticated(true);

        // Load user profile and server info
        await Promise.all([
          fetchUserProfile(),
          fetchServerInfo(),
          checkContentDownloaded()
        ]);

        // Load categories only if content has been downloaded
        if (contentDownloaded.channels) {
          await loadChannelCategories();
        }
        if (contentDownloaded.movies) {
          await loadMovieCategories();
        }
        if (contentDownloaded.shows) {
          await loadShowCategories();
        }
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setError('Failed to load data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [currentProfileId]);

  if (!currentProfileId) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground'>
            Redirecting to profile management...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
