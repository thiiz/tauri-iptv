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
import type { Show } from '@/types/iptv';
import { Grid3X3, List, MonitorPlay, Play, Search, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ShowsView() {
  const {
    showCategories,
    shows,
    loadShows,
    fetchShows,
    selectedCategory,
    setSelectedCategory,
    favorites,
    addFavorite,
    removeFavorite
  } = useIPTVStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);

  useEffect(() => {
    const loadShowsData = async () => {
      setIsLoading(true);
      try {
        // Load shows from IndexedDB only
        await loadShows(selectedCategory || undefined);
      } catch (error) {
        console.error('Failed to load shows:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadShowsData();
  }, [selectedCategory, loadShows]);

  useEffect(() => {
    let filtered = shows;
    if (searchQuery) {
      filtered = filtered.filter((show) =>
        show.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredShows(filtered);
  }, [shows, searchQuery]);

  const handleViewShow = (show: Show) => {
    alert(`Ver detalhes da série: ${show.name}`);
  };

  const handleToggleFavorite = (show: Show) => {
    const isFavorite = favorites.some(
      (fav) => fav.id === show.id && fav.type === 'show'
    );

    if (isFavorite) {
      removeFavorite(show.id);
    } else {
      addFavorite({
        id: show.id,
        type: 'show',
        name: show.name,
        streamIcon: show.streamIcon,
        addedAt: new Date().toISOString()
      });
    }
  };

  const isFavorite = (showId: string) => {
    return favorites.some((fav) => fav.id === showId && fav.type === 'show');
  };

  return (
    <div className='flex flex-1 flex-col'>
      <div className='border-b p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Séries</h1>
            <p className='text-muted-foreground'>
              {filteredShows.length} séries disponíveis
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

        <div className='mt-4 flex gap-4'>
          <div className='relative max-w-sm flex-1'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder='Buscar séries...'
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
              {showCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className='flex-1'>
        <div className='p-6'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <LoadingSpinner size='lg' />
            </div>
          ) : filteredShows.length === 0 ? (
            <div className='py-12 text-center'>
              <MonitorPlay className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>
                {searchQuery
                  ? 'Nenhuma série encontrada'
                  : 'Nenhuma série disponível'}
              </h3>
              <p className='text-muted-foreground'>
                {searchQuery
                  ? 'Tente ajustar sua busca'
                  : 'Faça o download do conteúdo na página inicial para visualizar as séries'}
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
              {filteredShows.map((show) => (
                <Card
                  key={show.id}
                  className='group cursor-pointer transition-all hover:shadow-md'
                >
                  <CardContent className='p-4'>
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
                      <h3 className='mb-1 truncate text-sm font-semibold'>
                        {show.name}
                      </h3>
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

                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        onClick={() => handleViewShow(show)}
                        className='flex-1'
                      >
                        <Play className='mr-1 h-4 w-4' />
                        Ver Série
                      </Button>

                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleToggleFavorite(show)}
                        className={isFavorite(show.id) ? 'text-yellow-600' : ''}
                      >
                        {isFavorite(show.id) ? (
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
