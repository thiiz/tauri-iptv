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
import { iptvDataService } from '@/lib/iptv-data-service';
import { useIPTVStore } from '@/lib/store';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  const [currentProfile, setCurrentProfileState] = useState<any>(null);

  // Get current profile asynchronously
  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (currentProfileId) {
        const profile = await getCurrentProfile();
        setCurrentProfileState(profile);
      } else {
        setCurrentProfileState(null);
      }
    };

    fetchCurrentProfile();
  }, [currentProfileId, getCurrentProfile]);

  // Profiles are now loaded by useProfileInitialization hook
  // No need to load them here again

  const handleSwitchProfile = async (profileId: string) => {
    if (profileId === currentProfileId) return;

    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;

    setIsLoading(true);
    try {
      await iptvDataService.initializeWithProfile(profile);

      // Test connection
      const isConnected = await iptvDataService.testConnection();
      if (!isConnected) {
        toast.error('Failed to connect to this profile');
        return;
      }

      // Get user profile and server info
      const [userProfile, serverInfo] = await Promise.all([
        iptvDataService.getUserProfile(),
        iptvDataService.getServerInfo()
      ]);

      // Set as current profile
      await setCurrentProfile(profile.id);
      await setAuthenticated(true);
      await setUserProfile(userProfile);
      await setServerInfo(serverInfo);

      toast.success(`Switched to ${profile.name}`);
    } catch (error) {
      toast.error('Failed to switch profile. Please try again.');
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
