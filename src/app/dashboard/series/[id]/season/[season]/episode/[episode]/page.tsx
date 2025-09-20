'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import VideoPlayer from '@/components/video-player';
import { iptvDataService } from '@/lib/iptv-data-service';
import type { Episode, ShowDetails } from '@/types/iptv';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Star
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function EpisodePlaybackPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.id as string;
  const seasonNumber = parseInt(params.season as string);
  const episodeNumber = parseInt(params.episode as string);

  const [series, setSeries] = useState<ShowDetails | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      if (!seriesId || isNaN(seasonNumber) || isNaN(episodeNumber)) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch series details
        const seriesDetails = await iptvDataService.getShowDetails(seriesId);
        setSeries(seriesDetails);

        // Filter episodes for the specific season
        const episodes =
          seriesDetails.episodes?.filter((ep) => ep.season === seasonNumber) ||
          [];
        setSeasonEpisodes(episodes);

        // Find the current episode
        const episode = episodes.find((ep) => ep.episodeNum === episodeNumber);
        if (!episode) {
          throw new Error('Episode not found');
        }
        setCurrentEpisode(episode);

        // Generate stream URL
        const url = iptvDataService.generateStreamUrl({
          type: 'episode',
          streamId: episode.id,
          extension: episode.containerExtension
        });
        setStreamUrl(url);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load episode';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEpisodeData();
  }, [seriesId, seasonNumber, episodeNumber]);

  const handleBackToSeason = () => {
    router.push(`/dashboard/series/${seriesId}/season/${seasonNumber}`);
  };

  const handleBackToSeries = () => {
    router.push(`/dashboard/series/${seriesId}`);
  };

  const navigateToEpisode = (targetEpisodeNum: number) => {
    const targetEpisode = seasonEpisodes.find(
      (ep) => ep.episodeNum === targetEpisodeNum
    );
    if (targetEpisode) {
      router.push(
        `/dashboard/series/${seriesId}/season/${seasonNumber}/episode/${targetEpisodeNum}`
      );
    }
  };

  const handlePreviousEpisode = () => {
    if (currentEpisode && episodeNumber > 1) {
      navigateToEpisode(episodeNumber - 1);
    }
  };

  const handleNextEpisode = () => {
    if (currentEpisode) {
      const maxEpisode = Math.max(...seasonEpisodes.map((ep) => ep.episodeNum));
      if (episodeNumber < maxEpisode) {
        navigateToEpisode(episodeNumber + 1);
      }
    }
  };

  const getPreviousEpisode = () => {
    return seasonEpisodes.find((ep) => ep.episodeNum === episodeNumber - 1);
  };

  const getNextEpisode = () => {
    return seasonEpisodes.find((ep) => ep.episodeNum === episodeNumber + 1);
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
          <div className='space-y-6'>
            <Skeleton className='aspect-video w-full' />
            <div className='space-y-4'>
              <Skeleton className='h-8 w-96' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !series || !currentEpisode) {
    return (
      <div className='flex flex-1 flex-col'>
        <div className='border-b p-6'>
          <Button variant='ghost' onClick={handleBackToSeason} className='mb-4'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Season
          </Button>
        </div>

        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <h2 className='mb-2 text-2xl font-bold'>Error Loading Episode</h2>
            <p className='text-muted-foreground mb-4'>
              {error || 'Episode not found'}
            </p>
            <Button onClick={handleBackToSeason}>Back to Season</Button>
          </div>
        </div>
      </div>
    );
  }

  const previousEpisode = getPreviousEpisode();
  const nextEpisode = getNextEpisode();

  return (
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='border-b p-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            onClick={handleBackToSeason}
            className='shrink-0'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>

          <div className='min-w-0 flex-1'>
            <div className='text-muted-foreground mb-1 flex items-center gap-2 text-sm'>
              <Button
                variant='link'
                onClick={handleBackToSeries}
                className='h-auto p-0 text-sm'
              >
                {series.name}
              </Button>
              <span>/</span>
              <span>Season {seasonNumber}</span>
              <span>/</span>
              <span>Episode {episodeNumber}</span>
            </div>
            <h1 className='truncate text-3xl font-bold tracking-tight'>
              {currentEpisode.title}
            </h1>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl space-y-6 p-6'>
          {/* Video Player */}
          <div className='aspect-video w-full overflow-hidden rounded-lg bg-black'>
            {streamUrl ? (
              <VideoPlayer src={streamUrl} className='h-full w-full' />
            ) : (
              <div className='flex h-full w-full items-center justify-center'>
                <div className='text-center text-white'>
                  <Play className='mx-auto mb-4 h-16 w-16 opacity-50' />
                  <p>Loading video...</p>
                </div>
              </div>
            )}
          </div>

          {/* Episode Info */}
          <Card>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline'>
                      Episode {currentEpisode.episodeNum}
                    </Badge>
                    {currentEpisode.info?.rating && (
                      <Badge
                        variant='secondary'
                        className='flex items-center gap-1'
                      >
                        <Star className='h-3 w-3' />
                        {currentEpisode.info.rating}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className='text-2xl'>
                    {currentEpisode.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className='space-y-4'>
              {currentEpisode.info?.plot && (
                <div>
                  <h3 className='mb-2 font-semibold'>Plot</h3>
                  <p className='text-muted-foreground leading-relaxed'>
                    {currentEpisode.info.plot}
                  </p>
                </div>
              )}

              <div className='text-muted-foreground flex flex-wrap gap-6 text-sm'>
                {currentEpisode.info?.releaseDate && (
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4' />
                    <span>
                      {new Date(
                        currentEpisode.info.releaseDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {currentEpisode.containerExtension && (
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4' />
                    <span>
                      {currentEpisode.containerExtension.toUpperCase()}
                    </span>
                  </div>
                )}

                {currentEpisode.info?.genre && (
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>Genre:</span>
                    <span>{currentEpisode.info.genre}</span>
                  </div>
                )}
              </div>

              {(currentEpisode.info?.cast || currentEpisode.info?.director) && (
                <div className='space-y-2'>
                  {currentEpisode.info.cast && (
                    <div>
                      <span className='font-medium'>Cast: </span>
                      <span className='text-muted-foreground'>
                        {currentEpisode.info.cast}
                      </span>
                    </div>
                  )}
                  {currentEpisode.info.director && (
                    <div>
                      <span className='font-medium'>Director: </span>
                      <span className='text-muted-foreground'>
                        {currentEpisode.info.director}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <Button
                    variant='outline'
                    onClick={handlePreviousEpisode}
                    disabled={!previousEpisode}
                    className='flex items-center gap-2'
                  >
                    <ChevronLeft className='h-4 w-4' />
                    Previous Episode
                  </Button>

                  {previousEpisode && (
                    <div className='text-sm'>
                      <p className='font-medium'>{previousEpisode.title}</p>
                      <p className='text-muted-foreground'>
                        Episode {previousEpisode.episodeNum}
                      </p>
                    </div>
                  )}
                </div>

                <div className='flex items-center gap-4'>
                  {nextEpisode && (
                    <div className='text-right text-sm'>
                      <p className='font-medium'>{nextEpisode.title}</p>
                      <p className='text-muted-foreground'>
                        Episode {nextEpisode.episodeNum}
                      </p>
                    </div>
                  )}

                  <Button
                    variant='outline'
                    onClick={handleNextEpisode}
                    disabled={!nextEpisode}
                    className='flex items-center gap-2'
                  >
                    Next Episode
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
