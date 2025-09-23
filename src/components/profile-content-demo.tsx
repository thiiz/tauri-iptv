'use client';

import React, { useEffect, useState } from 'react';
import { useIPTVStore } from '@/lib/store';
import { useProfileContentStore } from '@/lib/stores/ProfileContentStore';
import { ProfileAccount } from '@/types/iptv';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProfileContentDemo() {
  const { currentProfileId, profiles } = useIPTVStore();
  const contentStore = useProfileContentStore();

  const [loading, setLoading] = useState(false);
  const [contentStatus, setContentStatus] = useState({
    channels: false,
    movies: false,
    shows: false
  });

  // Atualizar status do conteúdo quando o perfil mudar
  useEffect(() => {
    if (currentProfileId) {
      checkContentStatus();
    }
  }, [currentProfileId]);

  const checkContentStatus = async () => {
    if (!currentProfileId) return;

    const [hasChannels, hasMovies, hasShows] = await Promise.all([
      contentStore.checkContentExists(currentProfileId, 'channels'),
      contentStore.checkContentExists(currentProfileId, 'movies'),
      contentStore.checkContentExists(currentProfileId, 'shows')
    ]);

    setContentStatus({
      channels: hasChannels,
      movies: hasMovies,
      shows: hasShows
    });
  };

  const loadContentForProfile = async (
    type: 'channels' | 'movies' | 'shows'
  ) => {
    if (!currentProfileId) return;

    setLoading(true);
    try {
      switch (type) {
        case 'channels':
          await contentStore.loadChannels(currentProfileId);
          break;
        case 'movies':
          await contentStore.loadMovies(currentProfileId);
          break;
        case 'shows':
          await contentStore.loadShows(currentProfileId);
          break;
      }
      await checkContentStatus();
    } catch (error) {
      console.error(`Erro ao carregar ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const currentProfile = profiles.find((p) => p.id === currentProfileId) as
    | ProfileAccount
    | undefined;

  if (!currentProfileId) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p className='text-muted-foreground'>Nenhum perfil selecionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conteúdo do Perfil: {currentProfile?.name}</CardTitle>
        <CardDescription>
          Gerencie o conteúdo específico deste perfil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='status' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='status'>Status</TabsTrigger>
            <TabsTrigger value='conteudo'>Conteúdo</TabsTrigger>
          </TabsList>

          <TabsContent value='status' className='space-y-4'>
            <div className='grid gap-4'>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <h4 className='font-medium'>Canais</h4>
                  <p className='text-muted-foreground text-sm'>
                    {contentStatus.channels
                      ? 'Conteúdo disponível'
                      : 'Sem conteúdo'}
                  </p>
                </div>
                <Badge
                  variant={contentStatus.channels ? 'default' : 'secondary'}
                >
                  {contentStatus.channels ? 'Disponível' : 'Indisponível'}
                </Badge>
              </div>

              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <h4 className='font-medium'>Filmes</h4>
                  <p className='text-muted-foreground text-sm'>
                    {contentStatus.movies
                      ? 'Conteúdo disponível'
                      : 'Sem conteúdo'}
                  </p>
                </div>
                <Badge variant={contentStatus.movies ? 'default' : 'secondary'}>
                  {contentStatus.movies ? 'Disponível' : 'Indisponível'}
                </Badge>
              </div>

              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <h4 className='font-medium'>Séries</h4>
                  <p className='text-muted-foreground text-sm'>
                    {contentStatus.shows
                      ? 'Conteúdo disponível'
                      : 'Sem conteúdo'}
                  </p>
                </div>
                <Badge variant={contentStatus.shows ? 'default' : 'secondary'}>
                  {contentStatus.shows ? 'Disponível' : 'Indisponível'}
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='conteudo' className='space-y-4'>
            <div className='grid gap-4'>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <h4 className='font-medium'>Canais</h4>
                  <p className='text-muted-foreground text-sm'>
                    Carregar canais para este perfil
                  </p>
                </div>
                <Button
                  onClick={() => loadContentForProfile('channels')}
                  disabled={loading}
                  size='sm'
                >
                  {loading ? 'Carregando...' : 'Carregar'}
                </Button>
              </div>

              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <h4 className='font-medium'>Filmes</h4>
                  <p className='text-muted-foreground text-sm'>
                    Carregar filmes para este perfil
                  </p>
                </div>
                <Button
                  onClick={() => loadContentForProfile('movies')}
                  disabled={loading}
                  size='sm'
                >
                  {loading ? 'Carregando...' : 'Carregar'}
                </Button>
              </div>

              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <h4 className='font-medium'>Séries</h4>
                  <p className='text-muted-foreground text-sm'>
                    Carregar séries para este perfil
                  </p>
                </div>
                <Button
                  onClick={() => loadContentForProfile('shows')}
                  disabled={loading}
                  size='sm'
                >
                  {loading ? 'Carregando...' : 'Carregar'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className='bg-muted mt-6 rounded-lg p-4'>
          <h4 className='mb-2 font-medium'>Como usar o novo sistema:</h4>
          <ul className='text-muted-foreground space-y-1 text-sm'>
            <li>• Cada perfil tem seu próprio conteúdo isolado</li>
            <li>• Use os botões para carregar conteúdo específico</li>
            <li>• O conteúdo é armazenado separadamente por perfil</li>
            <li>• Alterne entre perfis para ver conteúdos diferentes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
