'use client';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { profileService } from '@/lib/services';
import { ProfileAccount } from '@/types/iptv';
import { useEffect, useState } from 'react';

interface SettingsContentProps {
  profileId: string;
}

export function SettingsContent({ profileId }: SettingsContentProps) {
  const [profile, setProfile] = useState<ProfileAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await profileService.getProfile(profileId);
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='p-6'>
        <div className='bg-destructive/10 text-destructive rounded-lg p-4'>
          Profile not found
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <h1 className='mb-6 text-3xl font-bold'>Settings</h1>
      <div className='bg-card rounded-lg border p-6'>
        <h2 className='mb-4 text-xl font-semibold'>Profile Information</h2>
        <div className='space-y-2'>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Name
            </label>
            <p className='text-lg'>{profile.name}</p>
          </div>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Server URL
            </label>
            <p className='text-sm'>{profile.config.url}</p>
          </div>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Username
            </label>
            <p className='text-sm'>{profile.config.username}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
