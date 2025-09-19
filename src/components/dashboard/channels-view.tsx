'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useIPTVStore } from '@/lib/store';
import { iptvDataService } from '@/lib/iptv-data-service';
import type { Channel } from '@/types/iptv';
import { Clock, Grid3X3, List, Play, Search, Star, Tv } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ChannelsView() {
  const {
    channelCategories,
    channels,
    loadChannels,
    fetchChannels,
    selectedCategory,
    setSelectedCategory,
    favorites,
    addFavorite,
    removeFavorite,
    addToHistory
  } = useIPTVStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);

  useEffect(() => {
    const loadChannelsData = async () => {
      setIsLoading(true);
      try {
        // Load channels from IndexedDB only
        await loadChannels(selectedCategory || undefined);
      } catch (error) {
        console.error('Failed to load channels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannelsData();
  }, [selectedCategory, loadChannels]);

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

      // Add to history
      addToHistory({
        id: channel.id,
        type: 'channel',
        name: channel.name,
        streamIcon: channel.streamIcon,
        watchedAt: new Date().toISOString()
      });

      // Open stream (in a real app, this would open in a video player)
      console.log('Playing channel:', channel.name, 'URL:', streamUrl);

      // For now, just show an alert
      alert(`Reproduzindo: ${channel.name}\nURL: ${streamUrl}`);
    } catch (error) {
      console.error('Failed to play channel:', error);
      alert('Erro ao reproduzir canal');
    }
  };

  const handleToggleFavorite = (channel: Channel) => {
    const isFavorite = favorites.some(
      (fav) => fav.id === channel.id && fav.type === 'channel'
    );

    if (isFavorite) {
      removeFavorite(channel.id);
    } else {
      addFavorite({
        id: channel.id,
        type: 'channel',
        name: channel.name,
        streamIcon: channel.streamIcon,
        addedAt: new Date().toISOString()
      });
    }
  };

  const isFavorite = (channelId: string) => {
    return favorites.some(
      (fav) => fav.id === channelId && fav.type === 'channel'
    );
  };

  return (
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='border-b p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Canais</h1>
            <p className='text-muted-foreground'>
              {filteredChannels.length} canais disponíveis
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
              placeholder='Buscar canais...'
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
              <SelectItem value='all'>Todas as categorias</SelectItem>
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
            <div className='flex items-center justify-center py-12'>
              <LoadingSpinner size='lg' />
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className='py-12 text-center'>
              <Tv className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>
                {searchQuery
                  ? 'Nenhum canal encontrado'
                  : 'Nenhum canal disponível'}
              </h3>
              <p className='text-muted-foreground'>
                {searchQuery
                  ? 'Tente ajustar sua busca'
                  : 'Faça o download do conteúdo na página inicial para visualizar os canais'}
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
                          Canal #{channel.id}
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
                        {viewMode === 'grid' ? '' : 'Assistir'}
                      </Button>

                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleToggleFavorite(channel)}
                        className={
                          isFavorite(channel.id) ? 'text-yellow-600' : ''
                        }
                      >
                        {isFavorite(channel.id) ? (
                          <Star className='h-4 w-4 fill-current' />
                        ) : (
                          <Star className='h-4 w-4' />
                        )}
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
