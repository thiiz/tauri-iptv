'use client';

import { ContentView } from '@/components/dashboard/content-view';
import { Badge } from '@/components/ui/badge';
import { useIPTVStore } from '@/lib/store';
import type { Show } from '@/types/iptv';
import { MonitorPlay } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ShowsView() {
  const router = useRouter();
  const { currentProfileId } = useIPTVStore();
  const {
    showCategories,
    shows,
    loadShows,
    loadShowCategories,
    selectedCategory,
    setSelectedCategory,
    contentDownloaded
  } = useIPTVStore();

  const handleViewShow = (show: Show) => {
    // Navigate to series details page
    router.push(`/dashboard/${currentProfileId}/series/${show.id}`);
  };

  const renderShowItem = (show: Show) => (
    <>
      <div className='mb-3'>
        {show.streamIcon ? (
          <img
            src={show.streamIcon}
            alt={show.name}
            className='h-32 w-full rounded object-cover'
          />
        ) : (
          <div className='bg-muted flex h-32 w-full items-center justify-center rounded'>
            <MonitorPlay className='text-muted-foreground h-8 w-8' />
          </div>
        )}
      </div>

      <div className='text-center'>
        <h3 className='mb-1 truncate text-sm font-semibold'>{show.name}</h3>
        <div className='mb-3 flex items-center justify-center gap-2'>
          {show.year && (
            <Badge variant='secondary' className='text-xs'>
              {show.year}
            </Badge>
          )}
          {show.rating && (
            <Badge variant='outline' className='text-xs'>
              ⭐ {show.rating}
            </Badge>
          )}
        </div>
      </div>
    </>
  );

  return (
    <ContentView
      title='Series'
      searchPlaceholder='Search series...'
      emptyState={{
        icon: MonitorPlay,
        title: 'No series available',
        description: 'Download content from the home page to view series'
      }}
      categories={showCategories}
      items={shows}
      loadCategories={loadShowCategories}
      loadItems={(category) => loadShows(category || undefined)}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      renderItem={renderShowItem}
      handleAction={handleViewShow}
      actionLabel='View Series'
      contentDownloaded={contentDownloaded.shows}
    />
  );
}
