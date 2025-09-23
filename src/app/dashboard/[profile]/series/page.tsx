'use client';

import { SeriesContent } from '@/components/dashboard/series-content';
import { useProfileValidation } from '@/hooks/use-profile-validation';
import { useIPTVStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download, MonitorPlay } from 'lucide-react';

export default function SeriesPage() {
  const { isLoading, currentProfile } = useProfileValidation();
  const { contentDownloaded, downloadShows } = useIPTVStore();

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  if (!currentProfile) {
    return null;
  }

  // Se o conteúdo não foi baixado, mostrar mensagem para baixar
  if (!contentDownloaded.shows) {
    return (
      <div className='flex flex-1 items-center justify-center p-6'>
        <div className='max-w-md text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 p-4 dark:bg-purple-900'>
            <MonitorPlay className='h-8 w-8 text-purple-600' />
          </div>
          <h2 className='mb-2 text-2xl font-bold'>Séries Não Disponíveis</h2>
          <p className='text-muted-foreground mb-6'>
            Você precisa baixar as séries antes de poder visualizá-las. Clique
            no botão abaixo para baixar todas as séries deste perfil.
          </p>
          <Button onClick={downloadShows} className='gap-2' size='lg'>
            <Download className='h-4 w-4' />
            Baixar Séries
          </Button>
        </div>
      </div>
    );
  }

  return <SeriesContent categoryId={undefined} autoFetch={true} />;
}
