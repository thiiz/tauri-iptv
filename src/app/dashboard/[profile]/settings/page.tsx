import { SettingsContent } from '@/components/dashboard/settings-content';
import { notFound } from 'next/navigation';
import { profileService } from '@/lib/profile-service';

interface SettingsPageProps {
  params: Promise<{
    profile: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { profile } = await params;

  // Verify the profile exists
  const profileData = await profileService.getProfile(profile);
  if (!profileData) {
    notFound();
  }

  // Set the current profile for this session
  await profileService.setCurrentProfile(profile);

  return <SettingsContent profileId={profile} />;
}
