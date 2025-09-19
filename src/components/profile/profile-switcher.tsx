'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { profileService } from '@/lib/profile-service';
import { useIPTVStore } from '@/lib/store';
import { tauriIPTVService } from '@/lib/tauri-iptv-service';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProfileSwitcherProps {
  onManageProfiles?: () => void;
}

export function ProfileSwitcher({ onManageProfiles }: ProfileSwitcherProps) {
  const {
    profiles,
    currentProfileId,
    setProfiles,
    setCurrentProfile,
    setAuthenticated,
    setUserProfile,
    setServerInfo,
    getCurrentProfile
  } = useIPTVStore();

  const [isLoading, setIsLoading] = useState(false);
  const currentProfile = getCurrentProfile();

  // Load profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const savedProfiles = await profileService.getProfiles();
        setProfiles(savedProfiles);
      } catch (error) {
        console.error('Failed to load profiles:', error);
      }
    };

    loadProfiles();
  }, [setProfiles]);

  const handleSwitchProfile = async (profileId: string) => {
    if (profileId === currentProfileId) return;

    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;

    setIsLoading(true);
    try {
      await tauriIPTVService.initializeWithProfile(profile);

      // Test connection
      const isConnected = await tauriIPTVService.testConnection();
      if (!isConnected) {
        console.error('Failed to connect to this profile');
        return;
      }

      // Get user profile and server info
      const [userProfile, serverInfo] = await Promise.all([
        tauriIPTVService.getUserProfile(),
        tauriIPTVService.getServerInfo()
      ]);

      // Set as current profile
      setCurrentProfile(profile.id);
      setAuthenticated(true);
      setUserProfile(userProfile);
      setServerInfo(serverInfo);

      console.log(`Switched to ${profile.name}`);
    } catch (error) {
      console.error('Failed to switch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (profiles.length === 0) {
    return (
      <Button variant='outline' onClick={onManageProfiles}>
        <Plus className='mr-2 h-4 w-4' />
        Add Profile
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          className='w-[200px] justify-between'
          disabled={isLoading}
        >
          <div className='flex items-center gap-2'>
            <Avatar className='h-6 w-6'>
              <AvatarFallback className='text-xs'>
                {currentProfile?.name.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className='truncate'>
              {currentProfile?.name || 'Select Profile'}
            </span>
          </div>
          <ChevronDown className='h-4 w-4 opacity-50' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-[200px]' align='end'>
        <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => handleSwitchProfile(profile.id)}
            className='flex items-center gap-2'
          >
            <Avatar className='h-6 w-6'>
              <AvatarFallback className='text-xs'>
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 truncate'>
              <div className='truncate font-medium'>{profile.name}</div>
              <div className='text-muted-foreground truncate text-xs'>
                {profile.config.username}
              </div>
            </div>
            {currentProfileId === profile.id && (
              <Badge variant='default' className='text-xs'>
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onManageProfiles}>
          <Settings className='mr-2 h-4 w-4' />
          Manage Profiles
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
