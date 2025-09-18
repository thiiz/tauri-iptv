'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useIPTVStore } from '@/lib/store';
import { AlertTriangle } from 'lucide-react';
import { ChannelsView } from './channels-view';
import { DashboardOverview } from './dashboard-overview';
import { FavoritesView } from './favorites-view';
import { HistoryView } from './history-view';
import { MoviesView } from './movies-view';
import { SettingsView } from './settings-view';
import { ShowsView } from './shows-view';

export function DashboardContent() {
  const { currentView, isLoading, error } = useIPTVStore();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'channels':
        return <ChannelsView />;
      case 'movies':
        return <MoviesView />;
      case 'shows':
        return <ShowsView />;
      case 'favorites':
        return <FavoritesView />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      {renderContent()}
    </div>
  );
}