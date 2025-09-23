'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProfile } from '@/contexts/profile-context';
import { Loader2 } from 'lucide-react';

interface ProfileAwareComponentProps {
  profileId: string;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export function ProfileAwareComponent({
  profileId,
  children,
  loadingComponent,
  errorComponent
}: ProfileAwareComponentProps) {
  const router = useRouter();
  const { isLoading, currentProfile, profiles, setCurrentProfile } =
    useProfile();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateProfile = async () => {
      if (isLoading) return;

      // Verificar se o perfil existe
      const profileExists = profiles.some((p) => p.id === profileId);

      if (!profileExists) {
        router.push('/dashboard/profiles');
        return;
      }

      // Se o perfil atual é diferente do solicitado, mudar
      if (!currentProfile || currentProfile.id !== profileId) {
        await setCurrentProfile(profileId);
      }

      setIsValidating(false);
    };

    validateProfile();
  }, [
    profileId,
    isLoading,
    currentProfile,
    profiles,
    router,
    setCurrentProfile
  ]);

  if (isLoading || isValidating) {
    return (
      loadingComponent || (
        <div className='flex flex-1 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      )
    );
  }

  if (!currentProfile) {
    return (
      errorComponent || (
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <p className='text-muted-foreground'>Profile not found</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

export function useProfileValidation() {
  const params = useParams();
  const router = useRouter();
  const { isLoading, currentProfile, profiles, setCurrentProfile } =
    useProfile();
  const [isValidating, setIsValidating] = useState(true);

  const profileId = params?.profile as string;

  useEffect(() => {
    const validateProfile = async () => {
      console.log('ProfileValidation: Validating profile...', {
        profileId,
        isLoading,
        currentProfile,
        profiles
      });
      if (isLoading || !profileId) return;

      // Verificar se o perfil existe
      const profileExists = profiles.some((p) => p.id === profileId);
      console.log('ProfileValidation: Profile exists:', profileExists);

      if (!profileExists) {
        router.push('/dashboard/profiles');
        return;
      }

      // Se o perfil atual é diferente do solicitado, mudar
      if (!currentProfile || currentProfile.id !== profileId) {
        console.log('ProfileValidation: Setting current profile...');
        await setCurrentProfile(profileId);
      }

      console.log('ProfileValidation: Validation completed');
      setIsValidating(false);
    };

    validateProfile();
  }, [
    profileId,
    isLoading,
    currentProfile,
    profiles,
    router,
    setCurrentProfile
  ]);

  return {
    profileId,
    currentProfile,
    isLoading: isLoading || isValidating,
    isValidProfile: !!currentProfile && currentProfile.id === profileId
  };
}
