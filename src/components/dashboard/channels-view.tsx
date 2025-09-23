'use client';

import { ContentView } from '@/components/dashboard/content-view';
import { Badge } from '@/components/ui/badge';
import { iptvDataService } from '@/lib/iptv-data-service';
import { useIPTVStore } from '@/lib/store';
import type { Channel } from '@/types/iptv';
import { Clock, Tv } from 'lucide-react';
import { toast } from 'sonner';

export function ChannelsView() {
  const {
    channelCategories,
    channels,
    loadChannels,
    loadChannelCategories,
    selectedCategory,
    setSelectedCategory,
    contentDownloaded
  } = useIPTVStore();

  const handlePlayChannel = (channel: Channel) => {
    try {
      const streamUrl = iptvDataService.generateStreamUrl({
        type: 'channel',
        streamId: channel.id,
        extension: 'm3u8'
      });

      // Open stream (in a real app, this would open in a video player)
      toast.success(`Playing: ${channel.name}`);
      // Note: Stream URL could be opened in a new tab or player here
    } catch (error) {
      toast.error('Failed to play channel. Please try again.');
    }
  };

  const renderChannelItem = (channel: Channel, viewMode: 'grid' | 'list') => (
    <>
      <div className={`${viewMode === 'list' ? 'flex-shrink-0' : 'mb-3'}`}>
        {channel.streamIcon ? (
          <img
            src={channel.streamIcon}
            alt={channel.name}
            className={`rounded object-cover ${
              viewMode === 'list' ? 'h-12 w-12' : 'mx-auto h-16 w-16'
            }`}
          />
        ) : (
          <div
            className={`bg-muted flex items-center justify-center rounded ${
              viewMode === 'list' ? 'h-12 w-12' : 'mx-auto h-16 w-16'
            }`}
          >
            <Tv className='text-muted-foreground h-6 w-6' />
          </div>
        )}
      </div>

      <div
        className={`${viewMode === 'list' ? 'min-w-0 flex-1' : 'text-center'}`}
      >
        <h3
          className={`font-semibold ${viewMode === 'list' ? 'text-base' : 'text-sm'} truncate`}
        >
          {channel.name}
        </h3>
        <div className='mt-1 flex items-center gap-2'>
          <Badge variant='secondary' className='text-xs'>
            Channel #{channel.id}
          </Badge>
          {channel.tvArchive > 0 && (
            <Badge variant='outline' className='text-xs'>
              <Clock className='mr-1 h-3 w-3' />
              Archive
            </Badge>
          )}
        </div>
      </div>
    </>
  );

  return (
    <ContentView
      title='Channels'
      searchPlaceholder='Search channels...'
      emptyState={{
        icon: Tv,
        title: 'No channels available',
        description: 'Download content from the home page to view channels'
      }}
      categories={channelCategories}
      items={channels}
      loadCategories={loadChannelCategories}
      loadItems={(category) => loadChannels(category || undefined)}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      renderItem={renderChannelItem}
      handleAction={handlePlayChannel}
      actionLabel='Watch'
      contentDownloaded={contentDownloaded.channels}
      isChannelView={true}
    />
  );
}
