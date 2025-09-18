'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIPTVStore } from '@/lib/store';
import { tauriIPTVService } from '@/lib/tauri-iptv-service';
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

export function DashboardOverview() {
  const {
    channelCategories,
    movieCategories,
    showCategories,
    favorites,
    watchHistory,
    userProfile,
    serverInfo,
    setChannels,
    setMovies,
    setShows,
    setCurrentView
  } = useIPTVStore();

  const [recentChannels, setRecentChannels] = useState<Channel[]>([]);
  const [recentMovies, setRecentMovies] = useState<Movie[]>([]);
  const [recentShows, setRecentShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRecentContent = async () => {
      setIsLoading(true);
      try {
        // Load recent channels, movies, and shows (limited)
        const [channels, movies, shows] = await Promise.all([
          tauriIPTVService.getChannels({ limit: 6 }),
          tauriIPTVService.getMovies({ limit: 6 }),
          tauriIPTVService.getShows({ limit: 6 }),
        ]);

        setRecentChannels(channels);
        setRecentMovies(movies);
        setRecentShows(shows);

        // Update store with full data
        setChannels(channels);
        setMovies(movies);
        setShows(shows);
      } catch (error) {
        console.error('Failed to load recent content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentContent();
  }, [setChannels, setMovies, setShows]);

  const stats = [
    {
      title: 'Canais',
      value: channelCategories.length,
      icon: Tv,
      description: 'Categorias disponíveis',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Filmes',
      value: movieCategories.length,
      icon: Film,
      description: 'Categorias de filmes',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Séries',
      value: showCategories.length,
      icon: MonitorPlay,
      description: 'Categorias de séries',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Favoritos',
      value: favorites.length,
      icon: Star,
      description: 'Itens favoritados',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
  ];

  const recentHistory = watchHistory.slice(0, 5);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {userProfile?.username || 'Usuário'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5" />
              Canais Recentes
            </CardTitle>
            <CardDescription>
              Últimos canais adicionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {recentChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {channel.streamIcon ? (
                        <img
                          src={channel.streamIcon}
                          alt={channel.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Tv className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Canal #{channel.id}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setCurrentView('channels')}
            >
              Ver Todos os Canais
            </Button>
          </CardContent>
        </Card>

        {/* Recent Movies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Filmes Recentes
            </CardTitle>
            <CardDescription>
              Últimos filmes adicionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {recentMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {movie.streamIcon ? (
                        <img
                          src={movie.streamIcon}
                          alt={movie.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Film className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm">{movie.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {movie.year && `${movie.year} • `}
                          {movie.rating && `⭐ ${movie.rating}`}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setCurrentView('movies')}
            >
              Ver Todos os Filmes
            </Button>
          </CardContent>
        </Card>

        {/* Watch History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico Recente
            </CardTitle>
            <CardDescription>
              Últimos itens assistidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {recentHistory.length > 0 ? (
                  recentHistory.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {item.streamIcon ? (
                          <img
                            src={item.streamIcon}
                            alt={item.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            {item.type === 'channel' && <Tv className="h-4 w-4" />}
                            {item.type === 'movie' && <Film className="h-4 w-4" />}
                            {item.type === 'episode' && <MonitorPlay className="h-4 w-4" />}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {item.type === 'channel' && 'Canal'}
                              {item.type === 'movie' && 'Filme'}
                              {item.type === 'episode' && 'Episódio'}
                            </Badge>
                            <span className="ml-2">
                              {new Date(item.watchedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum histórico ainda</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            {recentHistory.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setCurrentView('history')}
              >
                Ver Histórico Completo
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Server Info */}
      {serverInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Informações do Servidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-sm font-medium">Servidor</div>
                <div className="text-2xl font-bold">{serverInfo.url}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Protocolo</div>
                <div className="text-2xl font-bold">{serverInfo.serverProtocol}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Timezone</div>
                <div className="text-2xl font-bold">{serverInfo.timezone}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Status</div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}