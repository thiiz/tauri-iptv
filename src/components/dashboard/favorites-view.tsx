'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIPTVStore } from '@/lib/store';
import { Film, MonitorPlay, Play, Search, Star, Trash2, Tv } from 'lucide-react';
import { useState } from 'react';

export function FavoritesView() {
  const { favorites, removeFavorite } = useIPTVStore();
  const [searchQuery, setSearchQuery] = useState('');

  const channelFavorites = favorites.filter(fav => fav.type === 'channel');
  const movieFavorites = favorites.filter(fav => fav.type === 'movie');
  const showFavorites = favorites.filter(fav => fav.type === 'show');

  const filterFavorites = (items: typeof favorites) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleRemoveFavorite = (id: string) => {
    removeFavorite(id);
  };

  const FavoritesList = ({ items, emptyIcon: EmptyIcon, emptyText }: {
    items: typeof favorites;
    emptyIcon: any;
    emptyText: string;
  }) => {
    const filteredItems = filterFavorites(items);

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12">
          <EmptyIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'Nenhum resultado encontrado' : emptyText}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Tente ajustar sua busca' : 'Adicione itens aos favoritos para vê-los aqui'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map((item) => (
          <Card key={`${item.type}-${item.id}`} className="group">
            <CardContent className="p-4">
              <div className="mb-3">
                {item.streamIcon ? (
                  <img
                    src={item.streamIcon}
                    alt={item.name}
                    className="h-24 w-full rounded object-cover"
                  />
                ) : (
                  <div className="h-24 w-full rounded bg-muted flex items-center justify-center">
                    {item.type === 'channel' && <Tv className="h-6 w-6 text-muted-foreground" />}
                    {item.type === 'movie' && <Film className="h-6 w-6 text-muted-foreground" />}
                    {item.type === 'show' && <MonitorPlay className="h-6 w-6 text-muted-foreground" />}
                  </div>
                )}
              </div>

              <div className="text-center mb-3">
                <h3 className="font-semibold text-sm truncate mb-1">
                  {item.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {item.type === 'channel' && 'Canal'}
                  {item.type === 'movie' && 'Filme'}
                  {item.type === 'show' && 'Série'}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Play className="h-4 w-4 mr-1" />
                  Assistir
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveFavorite(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground mt-2 text-center">
                Adicionado em {new Date(item.addedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-500" />
              Favoritos
            </h1>
            <p className="text-muted-foreground">
              {favorites.length} itens favoritados
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar favoritos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Todos ({favorites.length})
              </TabsTrigger>
              <TabsTrigger value="channels">
                Canais ({channelFavorites.length})
              </TabsTrigger>
              <TabsTrigger value="movies">
                Filmes ({movieFavorites.length})
              </TabsTrigger>
              <TabsTrigger value="shows">
                Séries ({showFavorites.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <FavoritesList
                items={favorites}
                emptyIcon={Star}
                emptyText="Nenhum favorito ainda"
              />
            </TabsContent>

            <TabsContent value="channels" className="mt-6">
              <FavoritesList
                items={channelFavorites}
                emptyIcon={Tv}
                emptyText="Nenhum canal favorito"
              />
            </TabsContent>

            <TabsContent value="movies" className="mt-6">
              <FavoritesList
                items={movieFavorites}
                emptyIcon={Film}
                emptyText="Nenhum filme favorito"
              />
            </TabsContent>

            <TabsContent value="shows" className="mt-6">
              <FavoritesList
                items={showFavorites}
                emptyIcon={MonitorPlay}
                emptyText="Nenhuma série favorita"
              />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}