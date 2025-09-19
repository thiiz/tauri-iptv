'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { iptvDataService } from '@/lib/iptv-data-service';
import { profileServiceIndexedDB } from '@/lib/profile-service-indexeddb';
import { useIPTVStore } from '@/lib/store';
import type { ProfileAccount, XtreamConfig } from '@/types/iptv';
import { Play, Plus, Settings, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
// Using console.log instead of toast for now

export function ProfileManager() {
  const router = useRouter();

  const {
    profiles,
    currentProfileId,
    setProfiles,
    addProfile,
    deleteProfile,
    setCurrentProfile,
    setAuthenticated,
    setUserProfile,
    setServerInfo,
    setError
  } = useIPTVStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
    preferredFormat: 'm3u8'
  });

  // Profiles are now loaded by useProfileInitialization hook
  // No need to load them here again

  const handleAddProfile = async () => {
    if (
      !newProfile.name ||
      !newProfile.url ||
      !newProfile.username ||
      !newProfile.password
    ) {
      console.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const config: XtreamConfig = {
        url: newProfile.url,
        username: newProfile.username,
        password: newProfile.password,
        preferredFormat: newProfile.preferredFormat
      };

      // Test connection first
      await iptvDataService.initialize(config);
      const isConnected = await iptvDataService.testConnection();

      if (!isConnected) {
        console.error('Failed to connect with provided credentials');
        return;
      }

      const profile = profileServiceIndexedDB.createProfile(
        newProfile.name,
        config
      );

      // Save to IndexedDB
      await profileServiceIndexedDB.saveProfile(profile);

      // Add to store
      addProfile(profile);

      // Reset form
      setNewProfile({
        name: '',
        url: '',
        username: '',
        password: '',
        preferredFormat: 'm3u8'
      });

      setIsAddDialogOpen(false);
      console.log('Profile added successfully');

      // Automatically activate the new profile
      await handleActivateProfile(profile);
    } catch (error) {
      console.error('Failed to add profile:', error);
      setError(
        'Failed to add profile. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await profileServiceIndexedDB.deleteProfile(profileId);
      await deleteProfile(profileId);
      console.log('Profile deleted successfully');
    } catch (error) {
      console.error('Failed to delete profile:', error);
      setError('Failed to delete profile. Please try again.');
    }
  };

  const handleActivateProfile = async (profile: ProfileAccount) => {
    setIsLoading(true);
    try {
      await iptvDataService.initializeWithProfile(profile);

      // Test connection
      const isConnected = await iptvDataService.testConnection();
      if (!isConnected) {
        console.error('Failed to connect to this profile');
        return;
      }

      // Get user profile and server info
      const [userProfile, serverInfo] = await Promise.all([
        iptvDataService.getUserProfile(),
        iptvDataService.getServerInfo()
      ]);

      // Update profile with last used timestamp and user data
      const updatedProfile = {
        ...profile,
        isActive: true,
        lastUsed: new Date().toISOString(),
        userProfile,
        serverInfo
      };

      // Save updated profile
      await profileServiceIndexedDB.saveProfile(updatedProfile);

      // Set as current profile (this will handle deactivating others)
      await setCurrentProfile(profile.id);
      await setAuthenticated(true);
      await setUserProfile(userProfile);
      await setServerInfo(serverInfo);

      console.log(`Switched to profile: ${profile.name}`);

      // Redirect to dashboard after activation
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to activate profile:', error);
      setError(
        'Failed to activate profile. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Profile Management</h2>
          <p className='text-muted-foreground'>
            Manage your IPTV account profiles
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              Add Profile
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle>Add New Profile</DialogTitle>
              <DialogDescription>
                Add a new IPTV account profile to switch between different
                services.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Profile Name</Label>
                <Input
                  id='name'
                  value={newProfile.name}
                  onChange={(e) =>
                    setNewProfile((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder='My IPTV Service'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='url'>Server URL</Label>
                <Input
                  id='url'
                  value={newProfile.url}
                  onChange={(e) =>
                    setNewProfile((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder='http://example.com:8080'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='username'>Username</Label>
                <Input
                  id='username'
                  value={newProfile.username}
                  onChange={(e) =>
                    setNewProfile((prev) => ({
                      ...prev,
                      username: e.target.value
                    }))
                  }
                  placeholder='your_username'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  value={newProfile.password}
                  onChange={(e) =>
                    setNewProfile((prev) => ({
                      ...prev,
                      password: e.target.value
                    }))
                  }
                  placeholder='your_password'
                />
              </div>
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddProfile} disabled={isLoading}>
                {isLoading ? 'Testing...' : 'Add Profile'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {profiles.map((profile) => (
          <Card
            key={profile.id}
            className={
              currentProfileId === profile.id ? 'ring-primary ring-2' : ''
            }
          >
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>{profile.name}</CardTitle>
                <div className='flex gap-1'>
                  {currentProfileId === profile.id && (
                    <Badge variant='default'>Active</Badge>
                  )}
                  {profile.lastUsed && <Badge variant='secondary'>Used</Badge>}
                </div>
              </div>
              <CardDescription>
                {profile.config.username}@
                {(() => {
                  try {
                    return new URL(profile.config.url).hostname;
                  } catch {
                    return 'invalid-url';
                  }
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground space-y-2 text-sm'>
                <div>
                  Created: {new Date(profile.createdAt).toLocaleDateString()}
                </div>
                {profile.lastUsed && (
                  <div>
                    Last used: {new Date(profile.lastUsed).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className='mt-4 flex gap-2'>
                <Button
                  size='sm'
                  onClick={() => handleActivateProfile(profile)}
                  disabled={isLoading || currentProfileId === profile.id}
                  className='flex-1'
                >
                  <Play className='mr-2 h-3 w-3' />
                  {currentProfileId === profile.id ? 'Active' : 'Activate'}
                </Button>

                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleDeleteProfile(profile.id)}
                  disabled={isLoading}
                >
                  <Trash2 className='h-3 w-3' />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {profiles.length === 0 && (
          <Card className='col-span-full'>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Settings className='text-muted-foreground mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>No Profiles Yet</h3>
              <p className='text-muted-foreground mb-4 text-center'>
                Add your first IPTV profile to get started
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className='mr-2 h-4 w-4' />
                Add Your First Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
