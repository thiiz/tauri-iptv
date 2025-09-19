'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIPTVStore } from '@/lib/store';
import type { Channel, Movie, Show } from '@/types/iptv';
import {
  Clock,
  Film,
  History,
  MonitorPlay,
  Play,
  Star,
  TrendingUp,
  Tv
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DownloadSection } from './download-section';

export function DashboardOverview() {
  const {
    channelCategories,
    movieCategories,
    showCategories,
    favorites,
    watchHistory,
    userProfile,
    serverInfo,
    channels,
    movies,
    shows,
    contentDownloaded,
    loadChannels,
    loadMovies,
    loadShows,
    fetchChannels,
    fetchMovies,
    fetchShows,
    setCurrentView,
    checkContentDownloaded,
    setError
  } = useIPTVStore();

  const [recentChannels, setRecentChannels] = useState<Channel[]>([]);
  const [recentMovies, setRecentMovies] = useState<Movie[]>([]);
  const [recentShows, setRecentShows] = useState<Show[]>([]);

  useEffect(() => {
    const loadRecentContent = async () => {
      try {
        // Check download status first
        await checkContentDownloaded();

        // Load content from IndexedDB only
        await Promise.all([loadChannels(), loadMovies(), loadShows()]);
      } catch (error) {
        console.error('Failed to load recent content:', error);
        setError(
          'Failed to load recent content. Please try refreshing the page.'
        );
      }
    };

    loadRecentContent();
  }, [loadChannels, loadMovies, loadShows, checkContentDownloaded]);

  // Update local state when store state changes
  useEffect(() => {
    setRecentChannels(channels.slice(0, 6));
    setRecentMovies(movies.slice(0, 6));
    setRecentShows(shows.slice(0, 6));
  }, [channels, movies, shows]);

  const stats = [
    {
      title: 'Canais',
      value: contentDownloaded.channels ? channelCategories.length : 0,
      icon: Tv,
      description: contentDownloaded.channels
        ? 'Categorias disponíveis'
        : 'Faça download para ver',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      title: 'Filmes',
      value: contentDownloaded.movies ? movieCategories.length : 0,
      icon: Film,
      description: contentDownloaded.movies
        ? 'Categorias de filmes'
        : 'Faça download para ver',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: 'Séries',
      value: contentDownloaded.shows ? showCategories.length : 0,
      icon: MonitorPlay,
      description: contentDownloaded.shows
        ? 'Categorias de séries'
        : 'Faça download para ver',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900'
    },
    {
      title: 'Favoritos',
      value: favorites.length,
      icon: Star,
      description: 'Itens favoritados',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900'
    }
  ];

  const recentHistory = watchHistory.slice(0, 5);

  return (
    <div className='flex-1 space-y-6 p-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground'>
          Bem-vindo de volta, {userProfile?.username || 'Usuário'}
        </p>
      </div>

      {/* Download Section */}
      <DownloadSection />

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stat.value}</div>
                <p className='text-muted-foreground text-xs'>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {/* Recent Channels - Only show if downloaded */}
        {contentDownloaded.channels && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Tv className='h-5 w-5' />
                Canais Recentes
              </CardTitle>
              <CardDescription>Últimos canais adicionados</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-48'>
                <div className='space-y-2'>
                  {recentChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className='hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-2'
                    >
                      <div className='flex items-center gap-3'>
                        {channel.streamIcon ? (
                          <img
                            src={channel.streamIcon}
                            alt={channel.name}
                            className='h-8 w-8 rounded object-cover'
                          />
                        ) : (
                          <div className='bg-muted flex h-8 w-8 items-center justify-center rounded'>
                            <Tv className='h-4 w-4' />
                          </div>
                        )}
                        <div>
                          <div className='text-sm font-medium'>
                            {channel.name}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            Canal #{channel.id}
                          </div>
                        </div>
                      </div>
                      <Button size='sm' variant='ghost'>
                        <Play className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                variant='outline'
                className='mt-4 w-full'
                onClick={() => setCurrentView('channels')}
              >
                Ver Todos os Canais
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Movies - Only show if downloaded */}
        {contentDownloaded.movies && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Film className='h-5 w-5' />
                Filmes Recentes
              </CardTitle>
              <CardDescription>Últimos filmes adicionados</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-48'>
                <div className='space-y-2'>
                  {recentMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className='hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-2'
                    >
                      <div className='flex items-center gap-3'>
                        {movie.streamIcon ? (
                          <img
                            src={movie.streamIcon}
                            alt={movie.name}
                            className='h-8 w-8 rounded object-cover'
                          />
                        ) : (
                          <div className='bg-muted flex h-8 w-8 items-center justify-center rounded'>
                            <Film className='h-4 w-4' />
                          </div>
                        )}
                        <div>
                          <div className='text-sm font-medium'>
                            {movie.name}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {movie.year && `${movie.year} • `}
                            {movie.rating && `⭐ ${movie.rating}`}
                          </div>
                        </div>
                      </div>
                      <Button size='sm' variant='ghost'>
                        <Play className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                variant='outline'
                className='mt-4 w-full'
                onClick={() => setCurrentView('movies')}
              >
                Ver Todos os Filmes
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Shows - Only show if downloaded */}
        {contentDownloaded.shows && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MonitorPlay className='h-5 w-5' />
                Séries Recentes
              </CardTitle>
              <CardDescription>Últimas séries adicionadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-48'>
                <div className='space-y-2'>
                  {recentShows.map((show) => (
                    <div
                      key={show.id}
                      className='hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-2'
                    >
                      <div className='flex items-center gap-3'>
                        {show.streamIcon ? (
                          <img
                            src={show.streamIcon}
                            alt={show.name}
                            className='h-8 w-8 rounded object-cover'
                          />
                        ) : (
                          <div className='bg-muted flex h-8 w-8 items-center justify-center rounded'>
                            <MonitorPlay className='h-4 w-4' />
                          </div>
                        )}
                        <div>
                          <div className='text-sm font-medium'>{show.name}</div>
                          <div className='text-muted-foreground text-xs'>
                            {show.year && `${show.year} • `}
                            {show.rating && `⭐ ${show.rating}`}
                          </div>
                        </div>
                      </div>
                      <Button size='sm' variant='ghost'>
                        <Play className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                variant='outline'
                className='mt-4 w-full'
                onClick={() => setCurrentView('shows')}
              >
                Ver Todas as Séries
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Watch History - Always show if there's history */}
        {(recentHistory.length > 0 ||
          (!contentDownloaded.channels &&
            !contentDownloaded.movies &&
            !contentDownloaded.shows)) && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <History className='h-5 w-5' />
                Histórico Recente
              </CardTitle>
              <CardDescription>Últimos itens assistidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-48'>
                <div className='space-y-2'>
                  {recentHistory.length > 0 ? (
                    recentHistory.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className='hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-2'
                      >
                        <div className='flex items-center gap-3'>
                          {item.streamIcon ? (
                            <img
                              src={item.streamIcon}
                              alt={item.name}
                              className='h-8 w-8 rounded object-cover'
                            />
                          ) : (
                            <div className='bg-muted flex h-8 w-8 items-center justify-center rounded'>
                              {item.type === 'channel' && (
                                <Tv className='h-4 w-4' />
                              )}
                              {item.type === 'movie' && (
                                <Film className='h-4 w-4' />
                              )}
                              {item.type === 'episode' && (
                                <MonitorPlay className='h-4 w-4' />
                              )}
                            </div>
                          )}
                          <div>
                            <div className='text-sm font-medium'>
                              {item.name}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              <Badge variant='secondary' className='text-xs'>
                                {item.type === 'channel' && 'Canal'}
                                {item.type === 'movie' && 'Filme'}
                                {item.type === 'episode' && 'Episódio'}
                              </Badge>
                              <span className='ml-2'>
                                {new Date(item.watchedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size='sm' variant='ghost'>
                          <Play className='h-4 w-4' />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className='text-muted-foreground py-8 text-center'>
                      <Clock className='mx-auto mb-2 h-8 w-8 opacity-50' />
                      <p>Nenhum histórico ainda</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              {recentHistory.length > 0 && (
                <Button
                  variant='outline'
                  className='mt-4 w-full'
                  onClick={() => setCurrentView('history')}
                >
                  Ver Histórico Completo
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Server Info */}
      {serverInfo && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Informações do Servidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <div>
                <div className='text-sm font-medium'>Servidor</div>
                <div className='text-2xl font-bold'>{serverInfo.url}</div>
              </div>
              <div>
                <div className='text-sm font-medium'>Protocolo</div>
                <div className='text-2xl font-bold'>
                  {serverInfo.serverProtocol}
                </div>
              </div>
              <div>
                <div className='text-sm font-medium'>Timezone</div>
                <div className='text-2xl font-bold'>{serverInfo.timezone}</div>
              </div>
              <div>
                <div className='text-sm font-medium'>Status</div>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-green-500'></div>
                  <span className='text-sm font-medium text-green-600'>
                    Online
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
