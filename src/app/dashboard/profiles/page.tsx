'use client';

import { ProfileManager } from '@/components/profile/profile-manager';
import { useProfileInitialization } from '@/hooks/use-profile-initialization';

export default function ProfilesPage() {
  // Initialize profiles on app start
  useProfileInitialization();

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <ProfileManager />
    </div>
  );
}
