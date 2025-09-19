'use client';

import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useProfileInitialization } from '@/hooks/use-profile-initialization';
import { useIPTVStore } from '@/lib/store';
import { tauriIPTVService } from '@/lib/tauri-iptv-service';
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
    setChannelCategories,
    setMovieCategories,
    setShowCategories,
    setLoading,
    setError
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
        const currentProfile = getCurrentProfile();
        if (!currentProfile) {
          router.push('/dashboard/profiles');
          return;
        }

        // Initialize the service with the current profile
        await tauriIPTVService.initializeWithProfile(currentProfile);

        // Set the store state
        setConfig(currentProfile.config);
        setAuthenticated(true);

        // Load user profile and server info
        const [userProfile, serverInfo] = await Promise.all([
          tauriIPTVService.getUserProfile(),
          tauriIPTVService.getServerInfo()
        ]);

        setUserProfile(userProfile);
        setServerInfo(serverInfo);

        // Load categories
        const [channelCategories, movieCategories, showCategories] =
          await Promise.all([
            tauriIPTVService.getChannelCategories(),
            tauriIPTVService.getMovieCategories(),
            tauriIPTVService.getShowCategories()
          ]);

        setChannelCategories(channelCategories);
        setMovieCategories(movieCategories);
        setShowCategories(showCategories);
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
