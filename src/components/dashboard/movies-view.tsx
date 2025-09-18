'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIPTVStore } from '@/lib/store';
import { tauriIPTVService } from '@/lib/tauri-iptv-service';
import type { Movie } from '@/types/iptv';
import { Film, Grid3X3, List, Play, Search, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export function MoviesView() {
  const {
    movieCategories,
    movies,
    setMovies,
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
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const loadMovies = async () => {
      setIsLoading(true);
      try {
        const movieData = await tauriIPTVService.getMovies({
          categoryId: selectedCategory || undefined,
          limit: 50
        });
        setMovies(movieData);
      } catch (error) {
        console.error('Failed to load movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMovies();
  }, [selectedCategory, setMovies]);

  useEffect(() => {
    let filtered = movies;
    if (searchQuery) {
      filtered = filtered.filter(movie =>
        movie.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredMovies(filtered);
  }, [movies, searchQuery]);

  const handlePlayMovie = (movie: Movie) => {
    try {
      const streamUrl = tauriIPTVService.generateStreamUrl({
        type: 'movie',
        streamId: movie.id,
        extension: movie.containerExtension || 'mp4'
      });

      addToHistory({
        id: movie.id,
        type: 'movie',
        name: movie.name,
        streamIcon: movie.streamIcon,
        watchedAt: new Date().toISOString()
      });

      alert(`Reproduzindo: ${movie.name}\nURL: ${streamUrl}`);
    } catch (error) {
      console.error('Failed to play movie:', error);
      alert('Erro ao reproduzir filme');
    }
  };

  const handleToggleFavorite = (movie: Movie) => {
    const isFavorite = favorites.some(fav => fav.id === movie.id && fav.type === 'movie');

    if (isFavorite) {
      removeFavorite(movie.id);
    } else {
      addFavorite({
        id: movie.id,
        type: 'movie',
        name: movie.name,
        streamIcon: movie.streamIcon,
        addedAt: new Date().toISOString()
      });
    }
  };

  const isFavorite = (movieId: string) => {
    return favorites.some(fav => fav.id === movieId && fav.type === 'movie');
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Filmes</h1>
            <p className="text-muted-foreground">
              {filteredMovies.length} filmes disponíveis
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar filmes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={selectedCategory || 'all'}
            onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {movieCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center py-12">
              <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum filme encontrado</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Tente ajustar sua busca' : 'Nenhum filme disponível nesta categoria'}
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'space-y-2'
            }>
              {filteredMovies.map((movie) => (
                <Card key={movie.id} className="group cursor-pointer transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      {movie.streamIcon ? (
                        <img
                          src={movie.streamIcon}
                          alt={movie.name}
                          className="h-32 w-full rounded object-cover"
                        />
                      ) : (
                        <div className="h-32 w-full rounded bg-muted flex items-center justify-center">
                          <Film className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <h3 className="font-semibold text-sm truncate mb-1">
                        {movie.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        {movie.year && (
                          <Badge variant="secondary" className="text-xs">
                            {movie.year}
                          </Badge>
                        )}
                        {movie.rating && (
                          <Badge variant="outline" className="text-xs">
                            ⭐ {movie.rating}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handlePlayMovie(movie)}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Assistir
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleFavorite(movie)}
                        className={isFavorite(movie.id) ? 'text-yellow-600' : ''}
                      >
                        {isFavorite(movie.id) ? (
                          <Star className="h-4 w-4 fill-current" />
                        ) : (
                          <Star className="h-4 w-4" />
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