'use client';

import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { useProfile } from '@/contexts/profile-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, hasProfiles, currentProfileId } = useProfile();

  useEffect(() => {
    // Se não tem perfis e não está carregando, redirecionar para página de perfis
    if (!isLoading && !hasProfiles) {
      router.push('/dashboard/profiles');
      return;
    }

    // Se tem um perfil selecionado, redirecionar para dashboard específico do perfil
    if (currentProfileId) {
      router.push(`/dashboard/${currentProfileId}`);
    }
  }, [isLoading, hasProfiles, currentProfileId, router]);

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground'>Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (!hasProfiles) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground'>
            Redirecting to profile management...
          </p>
        </div>
      </div>
    );
  }

  // Se tem um perfil, o useEffect acima redirecionará para o dashboard correto
  return null;
}
