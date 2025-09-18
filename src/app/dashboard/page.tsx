'use client';

import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useIPTVStore } from '@/lib/store';
import { tauriIPTVService } from '@/lib/tauri-iptv-service';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    config,
    setUserProfile,
    setServerInfo,
    setChannelCategories,
    setMovieCategories,
    setShowCategories,
    setLoading,
    setError
  } = useIPTVStore();

  useEffect(() => {
    if (!isAuthenticated || !config) {
      router.push('/setup');
      return;
    }

    const initializeData = async () => {
      setLoading(true);
      setError(null);

      try {
        await tauriIPTVService.initialize(config);

        // Load user profile and server info
        const [userProfile, serverInfo] = await Promise.all([
          tauriIPTVService.getUserProfile(),
          tauriIPTVService.getServerInfo(),
        ]);

        setUserProfile(userProfile);
        setServerInfo(serverInfo);

        // Load categories
        const [channelCategories, movieCategories, showCategories] = await Promise.all([
          tauriIPTVService.getChannelCategories(),
          tauriIPTVService.getMovieCategories(),
          tauriIPTVService.getShowCategories(),
        ]);

        setChannelCategories(channelCategories);
        setMovieCategories(movieCategories);
        setShowCategories(showCategories);

      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setError('Falha ao carregar dados. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [isAuthenticated, config, router, setUserProfile, setServerInfo, setChannelCategories, setMovieCategories, setShowCategories, setLoading, setError]);

  if (!isAuthenticated || !config) {
    return null;
  }

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}