'use client';

import { MoviesContent } from '@/components/dashboard/movies-content';
import { useProfileValidation } from '@/hooks/use-profile-validation';
import { useIPTVStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download, Film } from 'lucide-react';

export default function MoviesPage() {
  const { isLoading, currentProfile } = useProfileValidation();
  const { contentDownloaded, downloadMovies } = useIPTVStore();

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
  if (!contentDownloaded.movies) {
    return (
      <div className='flex flex-1 items-center justify-center p-6'>
        <div className='max-w-md text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 p-4 dark:bg-green-900'>
            <Film className='h-8 w-8 text-green-600' />
          </div>
          <h2 className='mb-2 text-2xl font-bold'>Filmes Não Disponíveis</h2>
          <p className='text-muted-foreground mb-6'>
            Você precisa baixar os filmes antes de poder visualizá-los. Clique
            no botão abaixo para baixar todos os filmes deste perfil.
          </p>
          <Button onClick={downloadMovies} className='gap-2' size='lg'>
            <Download className='h-4 w-4' />
            Baixar Filmes
          </Button>
        </div>
      </div>
    );
  }

  return <MoviesContent categoryId={undefined} autoFetch={true} />;
}
