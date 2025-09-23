import type { ProfileAccount, XtreamConfig } from '@/types/iptv';
import { profileServiceIndexedDB } from '../profile-service-indexeddb';

export class ProfileService {
  private static instance: ProfileService;
  private currentProfile: ProfileAccount | null = null;

  private constructor() {}

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  async getProfiles(): Promise<ProfileAccount[]> {
    return await profileServiceIndexedDB.getProfiles();
  }

  async getProfile(profileId: string): Promise<ProfileAccount | null> {
    return await profileServiceIndexedDB.getProfile(profileId);
  }

  async getCurrentProfile(): Promise<ProfileAccount | null> {
    if (this.currentProfile) {
      return this.currentProfile;
    }

    const profiles = await this.getProfiles();
    const activeProfile = profiles.find((p) => p.isActive);

    if (activeProfile) {
      this.currentProfile = activeProfile;
      return activeProfile;
    }

    return null;
  }

  async setCurrentProfile(profileId: string): Promise<void> {
    const profile = await this.getProfile(profileId);
    if (profile) {
      this.currentProfile = profile;
      await profileServiceIndexedDB.setActiveProfile(profileId);
    }
  }

  async clearCurrentProfile(): Promise<void> {
    this.currentProfile = null;
    // Set all profiles to inactive by setting active profile to null/undefined
    const profiles = await this.getProfiles();
    for (const profile of profiles) {
      if (profile.isActive) {
        profile.isActive = false;
        await profileServiceIndexedDB.saveProfile(profile);
      }
    }
  }

  getCurrentConfig(): XtreamConfig | null {
    return this.currentProfile?.config || null;
  }

  isAuthenticated(): boolean {
    return this.currentProfile !== null;
  }
}

export const profileService = ProfileService.getInstance();
