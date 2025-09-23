'use client';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useContent } from '@/hooks/useContent';
import { useIPTVStore } from '@/lib/store';
import { Play, Tv } from 'lucide-react';

interface ChannelsContentProps {
  categoryId?: string;
  autoFetch?: boolean;
}

export function ChannelsContent({
  categoryId,
  autoFetch = false
}: ChannelsContentProps) {
  const { contentDownloaded } = useIPTVStore();
  const {
    content: channels,
    isLoading,
    error,
    fetchContent: fetchChannels
  } = useContent('channels', {
    categoryId,
    autoFetch: autoFetch && contentDownloaded.channels, // Only auto-fetch if content is downloaded
    localOnly: true
  });

  console.log('ChannelsContent debug:', {
    channels,
    isLoading,
    error,
    autoFetch,
    categoryId,
    contentDownloaded: contentDownloaded.channels
  });

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-destructive/10 text-destructive rounded-lg p-4'>
          {error}
        </div>
      </div>
    );
  }

  // Show message if content hasn't been downloaded
  if (!contentDownloaded.channels) {
    return (
      <div className='p-6'>
        <div className='rounded-lg bg-blue-100 p-4 text-center text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
          <Tv className='mx-auto mb-2 h-8 w-8' />
          <p className='font-medium'>Canais não disponíveis</p>
          <p className='text-sm'>Baixe os canais para visualizar o conteúdo</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <h1 className='mb-6 text-3xl font-bold'>Channels</h1>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
        {channels.map((channel) => (
          <div
            key={channel.id}
            className='bg-card rounded-lg border p-4 transition-shadow hover:shadow-md'
          >
            <div className='bg-muted mb-3 flex aspect-video items-center justify-center rounded-md'>
              <Tv className='text-muted-foreground h-8 w-8' />
            </div>
            <h3 className='mb-1 truncate text-sm font-semibold'>
              {channel.name}
            </h3>
            <p className='text-muted-foreground mb-2 text-xs'>
              ID: {channel.id}
            </p>
            <Button size='sm' className='w-full'>
              <Play className='mr-1 h-3 w-3' />
              Play
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
