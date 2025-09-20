'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { iptvDataService } from '@/lib/iptv-data-service';
import type { Episode, ShowDetails } from '@/types/iptv';
import { ArrowLeft, Calendar, Clock, Play, Star } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SeriesDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.id as string;

  const [series, setSeries] = useState<ShowDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  useEffect(() => {
    const fetchSeriesDetails = async () => {
      if (!seriesId) return;

      try {
        setIsLoading(true);
        setError(null);
        const seriesDetails = await iptvDataService.getShowDetails(seriesId);
        setSeries(seriesDetails);

        // Set default season to the first one
        const seasons = Object.keys(seriesDetails.episodes)
          .map((key) => parseInt(key))
          .sort((a, b) => a - b);
        if (seasons.length > 0) {
          setSelectedSeason(seasons[0]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load series details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeriesDetails();
  }, [seriesId]);

  const getEpisodesBySeason = (season: number) => {
    return series?.episodes?.[season] || [];
  };

  const getSeasons = () => {
    if (!series?.episodes) return [];
    const seasons = Object.keys(series.episodes)
      .map((key) => parseInt(key))
      .sort((a, b) => a - b);
    return seasons;
  };

  const handlePlayEpisode = (episode: Episode) => {
    // TODO: Implement episode playback
    toast.info(`Playing: ${episode.title}`);
  };

  if (isLoading) {
    return (
      <div className='flex flex-1 flex-col'>
        <div className='border-b p-6'>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-10 w-10' />
            <div>
              <Skeleton className='h-8 w-64' />
              <Skeleton className='mt-2 h-4 w-32' />
            </div>
          </div>
        </div>

        <div className='flex-1 p-6'>
          <div className='grid gap-6 lg:grid-cols-3'>
            <div className='lg:col-span-1'>
              <Skeleton className='h-96 w-full' />
            </div>
            <div className='space-y-6 lg:col-span-2'>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-32 w-full' />
              <Skeleton className='h-64 w-full' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className='flex flex-1 flex-col'>
        <div className='border-b p-6'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='mb-4'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
        </div>

        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <h2 className='mb-2 text-2xl font-bold'>Error Loading Series</h2>
            <p className='text-muted-foreground mb-4'>
              {error || 'Series not found'}
            </p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const seasons = getSeasons();

  return (
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='border-b p-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='shrink-0'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>

          <div className='min-w-0 flex-1'>
            <h1 className='truncate text-3xl font-bold tracking-tight'>
              {series.name}
            </h1>
            <div className='text-muted-foreground mt-2 flex items-center gap-4 text-sm'>
              {series.year && (
                <div className='flex items-center gap-1'>
                  <Calendar className='h-4 w-4' />
                  {series.year}
                </div>
              )}
              {series.rating && (
                <div className='flex items-center gap-1'>
                  <Star className='h-4 w-4 fill-current' />
                  {series.rating}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className='flex-1'>
        <div className='p-6'>
          <div className='grid gap-6 lg:grid-cols-3'>
            {/* Series Poster/Info */}
            <div className='lg:col-span-1'>
              <Card>
                <CardContent className='p-6'>
                  {series.streamIcon ? (
                    <img
                      src={series.streamIcon}
                      alt={series.name}
                      className='aspect-[2/3] w-full rounded-lg object-cover'
                    />
                  ) : (
                    <div className='bg-muted flex aspect-[2/3] w-full items-center justify-center rounded-lg'>
                      <Play className='text-muted-foreground h-12 w-12' />
                    </div>
                  )}

                  <div className='mt-4 space-y-3'>
                    {series.genre && (
                      <div>
                        <h4 className='mb-2 font-semibold'>Genre</h4>
                        <div className='flex flex-wrap gap-1'>
                          {series.genre.split(',').map((genre, index) => (
                            <Badge key={index} variant='secondary'>
                              {genre.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {series.director && (
                      <div>
                        <h4 className='mb-2 font-semibold'>Director</h4>
                        <p className='text-muted-foreground text-sm'>
                          {series.director}
                        </p>
                      </div>
                    )}

                    {series.cast && (
                      <div>
                        <h4 className='mb-2 font-semibold'>Cast</h4>
                        <p className='text-muted-foreground text-sm'>
                          {series.cast}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Series Details and Episodes */}
            <div className='space-y-6 lg:col-span-2'>
              {/* Plot */}
              {series.plot && (
                <Card>
                  <CardHeader>
                    <CardTitle>Plot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground leading-relaxed'>
                      {series.plot}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Episodes by Season */}
              <Card>
                <CardHeader>
                  <CardTitle>Episodes</CardTitle>
                </CardHeader>
                <CardContent>
                  {seasons.length > 0 ? (
                    <Tabs
                      value={selectedSeason?.toString()}
                      onValueChange={(value) =>
                        setSelectedSeason(parseInt(value))
                      }
                    >
                      <TabsList className='grid w-full grid-cols-4 lg:grid-cols-6'>
                        {seasons.map((season) => (
                          <TabsTrigger key={season} value={season.toString()}>
                            Season {season}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {seasons.map((season) => (
                        <TabsContent key={season} value={season.toString()}>
                          <div className='mt-4 space-y-3'>
                            {getEpisodesBySeason(season).map((episode) => (
                              <Card
                                key={episode.id}
                                className='transition-shadow hover:shadow-md'
                              >
                                <CardContent className='p-4'>
                                  <div className='flex items-start gap-4'>
                                    <div className='min-w-0 flex-1'>
                                      <div className='mb-2 flex items-center gap-2'>
                                        <Badge variant='outline'>
                                          Episode {episode.episodeNum}
                                        </Badge>
                                        {episode.info?.rating && (
                                          <Badge variant='secondary'>
                                            ⭐ {episode.info.rating}
                                          </Badge>
                                        )}
                                      </div>

                                      <h4 className='mb-1 truncate font-semibold'>
                                        {episode.title}
                                      </h4>

                                      {episode.info?.plot && (
                                        <p className='text-muted-foreground mb-2 line-clamp-2 text-sm'>
                                          {episode.info.plot}
                                        </p>
                                      )}

                                      <div className='text-muted-foreground flex items-center gap-4 text-xs'>
                                        {episode.info?.releaseDate && (
                                          <div className='flex items-center gap-1'>
                                            <Calendar className='h-3 w-3' />
                                            {new Date(
                                              episode.info.releaseDate
                                            ).toLocaleDateString()}
                                          </div>
                                        )}
                                        {episode.containerExtension && (
                                          <div className='flex items-center gap-1'>
                                            <Clock className='h-3 w-3' />
                                            {episode.containerExtension}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <Button
                                      size='sm'
                                      onClick={() => handlePlayEpisode(episode)}
                                      className='shrink-0'
                                    >
                                      <Play className='mr-1 h-4 w-4' />
                                      Play
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className='py-8 text-center'>
                      <p className='text-muted-foreground'>
                        No episodes available
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
