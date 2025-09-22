'use client';

import { ChannelsContent } from '@/components/dashboard/channels-content';
import { useProfileValidation } from '@/hooks/use-profile-validation';
import { useIPTVStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download, Tv } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChannelsPage() {
  const { isLoading, currentProfile } = useProfileValidation();
  const { contentDownloaded, downloadChannels } = useIPTVStore();
  const router = useRouter();

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
  if (!contentDownloaded.channels) {
    return (
      <div className='flex flex-1 items-center justify-center p-6'>
        <div className='max-w-md text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 p-4 dark:bg-blue-900'>
            <Tv className='h-8 w-8 text-blue-600' />
          </div>
          <h2 className='mb-2 text-2xl font-bold'>Canais Não Disponíveis</h2>
          <p className='text-muted-foreground mb-6'>
            Você precisa baixar os canais antes de poder visualizá-los. Clique
            no botão abaixo para baixar todos os canais deste perfil.
          </p>
          <Button onClick={downloadChannels} className='gap-2' size='lg'>
            <Download className='h-4 w-4' />
            Baixar Canais
          </Button>
        </div>
      </div>
    );
  }

  return <ChannelsContent categoryId={undefined} autoFetch={true} />;
}
