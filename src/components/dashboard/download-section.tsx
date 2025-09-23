'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useIPTVStore } from '@/lib/store';
import { CheckCircle, Download, Film, Loader2, Play, Tv } from 'lucide-react';

export function DownloadSection() {
  const {
    downloadProgress,
    contentDownloaded,
    downloadChannels,
    downloadMovies,
    downloadShows,
    downloadAllContent
  } = useIPTVStore();

  const handleDownloadChannels = async () => {
    await downloadChannels();
  };

  const handleDownloadMovies = async () => {
    await downloadMovies();
  };

  const handleDownloadShows = async () => {
    await downloadShows();
  };

  const handleDownloadAll = async () => {
    await downloadAllContent();
  };

  const isDownloadingAny =
    downloadProgress.channels.isDownloading ||
    downloadProgress.movies.isDownloading ||
    downloadProgress.shows.isDownloading;

  const allDownloaded =
    contentDownloaded.channels &&
    contentDownloaded.movies &&
    contentDownloaded.shows;

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Download className='h-5 w-5' />
          Content Download
        </CardTitle>
        <CardDescription>
          Download IPTV content for offline access. You can download channels,
          movies, or series separately.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Download All Button */}
        <div className='flex justify-center'>
          <Button
            onClick={handleDownloadAll}
            disabled={isDownloadingAny}
            size='lg'
            className='w-full max-w-xs'
          >
            {isDownloadingAny ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Downloading...
              </>
            ) : (
              <>
                <Download className='mr-2 h-4 w-4' />
                Download All
              </>
            )}
          </Button>
        </div>

        {/* Individual Download Options */}
        <div className='grid gap-4 md:grid-cols-3'>
          {/* Channels */}
          <Card
            className={
              contentDownloaded.channels ? 'border-green-200 bg-green-50' : ''
            }
          >
            <CardContent className='p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Play className='h-4 w-4 text-blue-600' />
                  <span className='font-medium'>Channels</span>
                </div>
                {contentDownloaded.channels && (
                  <CheckCircle className='h-4 w-4 text-green-600' />
                )}
              </div>

              {downloadProgress.channels.isDownloading && (
                <div className='space-y-2'>
                  <Progress
                    value={
                      (downloadProgress.channels.progress /
                        downloadProgress.channels.total) *
                      100
                    }
                    className='h-2'
                  />
                  <p className='text-muted-foreground text-xs'>
                    {downloadProgress.channels.progress} /{' '}
                    {downloadProgress.channels.total}
                  </p>
                </div>
              )}

              <Button
                onClick={handleDownloadChannels}
                disabled={downloadProgress.channels.isDownloading}
                size='sm'
                variant={contentDownloaded.channels ? 'outline' : 'default'}
                className='mt-2 w-full'
              >
                {downloadProgress.channels.isDownloading ? (
                  <>
                    <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                    Downloading...
                  </>
                ) : contentDownloaded.channels ? (
                  'Re-download Channels'
                ) : (
                  'Download Channels'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Movies */}
          <Card
            className={
              contentDownloaded.movies ? 'border-green-200 bg-green-50' : ''
            }
          >
            <CardContent className='p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Film className='h-4 w-4 text-red-600' />
                  <span className='font-medium'>Movies</span>
                </div>
                {contentDownloaded.movies && (
                  <CheckCircle className='h-4 w-4 text-green-600' />
                )}
              </div>

              {downloadProgress.movies.isDownloading && (
                <div className='space-y-2'>
                  <Progress
                    value={
                      (downloadProgress.movies.progress /
                        downloadProgress.movies.total) *
                      100
                    }
                    className='h-2'
                  />
                  <p className='text-muted-foreground text-xs'>
                    {downloadProgress.movies.progress} /{' '}
                    {downloadProgress.movies.total}
                  </p>
                </div>
              )}

              <Button
                onClick={handleDownloadMovies}
                disabled={downloadProgress.movies.isDownloading}
                size='sm'
                variant={contentDownloaded.movies ? 'outline' : 'default'}
                className='mt-2 w-full'
              >
                {downloadProgress.movies.isDownloading ? (
                  <>
                    <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                    Downloading...
                  </>
                ) : contentDownloaded.movies ? (
                  'Re-download Movies'
                ) : (
                  'Download Movies'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Shows */}
          <Card
            className={
              contentDownloaded.shows ? 'border-green-200 bg-green-50' : ''
            }
          >
            <CardContent className='p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Tv className='h-4 w-4 text-purple-600' />
                  <span className='font-medium'>Series</span>
                </div>
                {contentDownloaded.shows && (
                  <CheckCircle className='h-4 w-4 text-green-600' />
                )}
              </div>

              {downloadProgress.shows.isDownloading && (
                <div className='space-y-2'>
                  <Progress
                    value={
                      (downloadProgress.shows.progress /
                        downloadProgress.shows.total) *
                      100
                    }
                    className='h-2'
                  />
                  <p className='text-muted-foreground text-xs'>
                    {downloadProgress.shows.progress} /{' '}
                    {downloadProgress.shows.total}
                  </p>
                </div>
              )}

              <Button
                onClick={handleDownloadShows}
                disabled={downloadProgress.shows.isDownloading}
                size='sm'
                variant={contentDownloaded.shows ? 'outline' : 'default'}
                className='mt-2 w-full'
              >
                {downloadProgress.shows.isDownloading ? (
                  <>
                    <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                    Downloading...
                  </>
                ) : contentDownloaded.shows ? (
                  'Re-download Series'
                ) : (
                  'Download Series'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className='text-muted-foreground text-center text-sm'>
          <p>
            Download may take several minutes depending on the amount of
            content.
          </p>
          <p>
            You can use the app normally while download happens in the
            background.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
