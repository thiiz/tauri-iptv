'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { iptvDataService } from '@/lib/iptv-data-service';
import { useIPTVStore } from '@/lib/store';
import type { Channel } from '@/types/iptv';
import { Clock, Grid3X3, List, Play, Search, Tv } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function ChannelsView() {
  const {
    channelCategories,
    channels,
    loadChannels,
    loadChannelCategories,
    fetchChannels,
    selectedCategory,
    setSelectedCategory,
    contentDownloaded
  } = useIPTVStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load categories and channels from IndexedDB
        await loadChannelCategories();
        await loadChannels(selectedCategory || undefined);
      } catch (error) {
        toast.error('Failed to load channels. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedCategory, loadChannels, loadChannelCategories]);

  useEffect(() => {
    let filtered = channels;

    if (searchQuery) {
      filtered = filtered.filter((channel) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredChannels(filtered);
  }, [channels, searchQuery]);

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

  return (
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='border-b p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Channels</h1>
            <p className='text-muted-foreground'>
              {filteredChannels.length} channels available
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('list')}
            >
              <List className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className='mt-4 flex gap-4'>
          <div className='relative max-w-sm flex-1'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder='Search channels...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8'
            />
          </div>

          <Select
            value={selectedCategory || 'all'}
            onValueChange={(value) =>
              setSelectedCategory(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Categoria' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {channelCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className='flex-1'>
        <div className='p-6'>
          {isLoading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'space-y-2'
              }
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <Card
                  key={i}
                  className={`group cursor-pointer transition-all hover:shadow-md ${
                    viewMode === 'list' ? 'flex-row' : ''
                  }`}
                >
                  <CardContent
                    className={`p-4 ${viewMode === 'list' ? 'flex w-full items-center gap-4' : ''}`}
                  >
                    <div
                      className={`${viewMode === 'list' ? 'flex-shrink-0' : 'mb-3'}`}
                    >
                      <Skeleton
                        className={`rounded object-cover ${
                          viewMode === 'list'
                            ? 'h-12 w-12'
                            : 'mx-auto h-16 w-16'
                        }`}
                      />
                    </div>
                    <div
                      className={`${viewMode === 'list' ? 'min-w-0 flex-1' : 'text-center'}`}
                    >
                      <Skeleton
                        className={`font-semibold ${viewMode === 'list' ? 'h-4 w-32' : 'mx-auto mb-1 h-4 w-3/4'}`}
                      />
                      <div className='mt-1 flex items-center gap-2'>
                        <Skeleton className='h-3 w-16' />
                        <Skeleton className='h-3 w-12' />
                      </div>
                    </div>
                    <div
                      className={`flex gap-2 ${
                        viewMode === 'list'
                          ? 'flex-shrink-0'
                          : 'mt-3 justify-center'
                      }`}
                    >
                      <Skeleton className='h-8 flex-1' />
                      <Skeleton className='h-8 w-8' />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className='py-12 text-center'>
              <Tv className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>
                {searchQuery ? 'No channels found' : 'No channels available'}
              </h3>
              <p className='text-muted-foreground'>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Download content from the home page to view channels'}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'space-y-2'
              }
            >
              {filteredChannels.map((channel) => (
                <Card
                  key={channel.id}
                  className={`group cursor-pointer transition-all hover:shadow-md ${
                    viewMode === 'list' ? 'flex-row' : ''
                  }`}
                >
                  <CardContent
                    className={`p-4 ${viewMode === 'list' ? 'flex w-full items-center gap-4' : ''}`}
                  >
                    {/* Channel Icon */}
                    <div
                      className={`${viewMode === 'list' ? 'flex-shrink-0' : 'mb-3'}`}
                    >
                      {channel.streamIcon ? (
                        <img
                          src={channel.streamIcon}
                          alt={channel.name}
                          className={`rounded object-cover ${
                            viewMode === 'list'
                              ? 'h-12 w-12'
                              : 'mx-auto h-16 w-16'
                          }`}
                        />
                      ) : (
                        <div
                          className={`bg-muted flex items-center justify-center rounded ${
                            viewMode === 'list'
                              ? 'h-12 w-12'
                              : 'mx-auto h-16 w-16'
                          }`}
                        >
                          <Tv className='text-muted-foreground h-6 w-6' />
                        </div>
                      )}
                    </div>

                    {/* Channel Info */}
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

                    {/* Actions */}
                    <div
                      className={`flex gap-2 ${
                        viewMode === 'list'
                          ? 'flex-shrink-0'
                          : 'mt-3 justify-center'
                      }`}
                    >
                      <Button
                        size='sm'
                        onClick={() => handlePlayChannel(channel)}
                        className='flex-1'
                      >
                        <Play className='mr-1 h-4 w-4' />
                        {viewMode === 'grid' ? '' : 'Watch'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
