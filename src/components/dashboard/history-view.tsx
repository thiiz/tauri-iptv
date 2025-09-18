'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIPTVStore } from '@/lib/store';
import { Film, History, MonitorPlay, Play, Search, Tv } from 'lucide-react';
import { useState } from 'react';

export function HistoryView() {
  const { watchHistory } = useIPTVStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = watchHistory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.watchedAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, typeof watchHistory>);

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <History className="h-8 w-8 text-blue-500" />
              Histórico
            </h1>
            <p className="text-muted-foreground">
              {watchHistory.length} itens no histórico
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no histórico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {Object.keys(groupedHistory).length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum histórico ainda'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Tente ajustar sua busca' : 'Comece assistindo conteúdo para ver seu histórico aqui'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, items]) => (
                  <div key={date}>
                    <h3 className="text-lg font-semibold mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2">
                      {new Date(date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {items
                        .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())
                        .map((item) => (
                          <Card key={`${item.type}-${item.id}-${item.watchedAt}`} className="group">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  {item.streamIcon ? (
                                    <img
                                      src={item.streamIcon}
                                      alt={item.name}
                                      className="h-12 w-12 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                      {item.type === 'channel' && <Tv className="h-5 w-5 text-muted-foreground" />}
                                      {item.type === 'movie' && <Film className="h-5 w-5 text-muted-foreground" />}
                                      {item.type === 'episode' && <MonitorPlay className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">
                                    {item.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {item.type === 'channel' && 'Canal'}
                                      {item.type === 'movie' && 'Filme'}
                                      {item.type === 'episode' && 'Episódio'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(item.watchedAt).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost">
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}