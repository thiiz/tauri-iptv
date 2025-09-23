'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { iptvDataService } from '@/lib/iptv-data-service';
import type { Episode, ShowDetails } from '@/types/iptv';
import { ArrowLeft, Calendar, Clock, Play } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SeasonEpisodesPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.id as string;
  const seasonNumber = parseInt(params.season as string);

  const [series, setSeries] = useState<ShowDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeriesAndEpisodes = async () => {
      if (!seriesId || isNaN(seasonNumber)) return;

      try {
        setIsLoading(true);
        setError(null);
        const seriesDetails = await iptvDataService.getShowDetails(seriesId);
        setSeries(seriesDetails);

        // Filter episodes for the specific season
        const seasonEpisodes = seriesDetails.episodes?.[seasonNumber] || [];
        setEpisodes(seasonEpisodes);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load season episodes';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeriesAndEpisodes();
  }, [seriesId, seasonNumber]);

  const handlePlayEpisode = (episode: Episode) => {
    router.push(
      `/dashboard/${params.profile}/series/${seriesId}/season/${seasonNumber}/episode/${episode.episodeNum}`
    );
  };

  const handleBackToSeries = () => {
    router.push(`/dashboard/${params.profile}/series/${seriesId}`);
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
          <div className='space-y-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-24 w-full' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className='flex flex-1 flex-col'>
        <div className='border-b p-6'>
          <Button variant='ghost' onClick={handleBackToSeries} className='mb-4'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Series
          </Button>
        </div>

        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <h2 className='mb-2 text-2xl font-bold'>Error Loading Episodes</h2>
            <p className='text-muted-foreground mb-4'>
              {error || 'Season not found'}
            </p>
            <Button onClick={handleBackToSeries}>Back to Series</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='border-b p-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            onClick={handleBackToSeries}
            className='shrink-0'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>

          <div className='min-w-0 flex-1'>
            <h1 className='truncate text-3xl font-bold tracking-tight'>
              {series.name} - Season {seasonNumber}
            </h1>
            <div className='text-muted-foreground mt-2 flex items-center gap-4 text-sm'>
              {episodes.length > 0 && (
                <div className='flex items-center gap-1'>
                  <Clock className='h-4 w-4' />
                  {episodes.length} episodes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className='flex-1'>
        <div className='p-6'>
          {episodes.length > 0 ? (
            <div className='space-y-4'>
              {episodes
                .sort((a, b) => a.episodeNum - b.episodeNum)
                .map((episode) => (
                  <Card
                    key={episode.id}
                    className='transition-shadow hover:shadow-md'
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-start gap-6'>
                        {/* Episode Thumbnail */}
                        <div className='flex-shrink-0'>
                          {episode.info?.movieImage ? (
                            <Image
                              src={episode.info.movieImage}
                              alt={episode.title}
                              width={128}
                              height={80}
                              className='h-20 w-32 rounded-lg object-cover'
                            />
                          ) : (
                            <div className='bg-muted flex h-20 w-32 items-center justify-center rounded-lg'>
                              <Play className='text-muted-foreground h-8 w-8' />
                            </div>
                          )}
                        </div>

                        {/* Episode Details */}
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-start justify-between gap-4'>
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

                              <h3 className='mb-2 truncate text-xl font-semibold'>
                                {episode.title}
                              </h3>

                              {episode.info?.plot && (
                                <p className='text-muted-foreground mb-3 line-clamp-3'>
                                  {episode.info.plot}
                                </p>
                              )}

                              <div className='text-muted-foreground flex flex-wrap items-center gap-4 text-sm'>
                                {episode.info?.releaseDate && (
                                  <div className='flex items-center gap-1'>
                                    <Calendar className='h-4 w-4' />
                                    {new Date(
                                      episode.info.releaseDate
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                                {episode.containerExtension && (
                                  <div className='flex items-center gap-1'>
                                    <Clock className='h-4 w-4' />
                                    {episode.containerExtension}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Play Button */}
                            <Button
                              size='lg'
                              onClick={() => handlePlayEpisode(episode)}
                              className='shrink-0'
                            >
                              <Play className='mr-2 h-5 w-5' />
                              Play Episode
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className='py-12 text-center'>
              <Play className='text-muted-foreground mx-auto mb-4 h-16 w-16' />
              <h3 className='mb-2 text-xl font-semibold'>No Episodes Found</h3>
              <p className='text-muted-foreground mb-6'>
                This season doesn't have any episodes available yet.
              </p>
              <Button onClick={handleBackToSeries}>Back to Series</Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
