'use client';

import { ProfileManager } from '@/components/profile/profile-manager';

export default function ProfilesPage() {
  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <ProfileManager />
    </div>
  );
}
