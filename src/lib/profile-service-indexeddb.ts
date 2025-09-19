import type { ProfileAccount, XtreamConfig } from '@/types/iptv';
import { indexedDBService } from './indexeddb-service';

export class ProfileServiceIndexedDB {
  async saveProfile(profile: ProfileAccount): Promise<void> {
    await indexedDBService.saveProfile(profile);
  }

  async getProfiles(): Promise<ProfileAccount[]> {
    return await indexedDBService.getProfiles();
  }

  async getProfile(profileId: string): Promise<ProfileAccount | null> {
    const profile = await indexedDBService.getProfile(profileId);
    return profile || null;
  }

  async deleteProfile(profileId: string): Promise<void> {
    await indexedDBService.deleteProfile(profileId);
  }

  async getActiveProfile(): Promise<ProfileAccount | null> {
    const profile = await indexedDBService.getActiveProfile();
    return profile || null;
  }

  async setActiveProfile(profileId: string): Promise<void> {
    // Get all profiles
    const profiles = await indexedDBService.getProfiles();

    // Update all profiles to set only the specified one as active
    const updatedProfiles = profiles.map((profile) => ({
      ...profile,
      isActive: profile.id === profileId
    }));

    // Save all updated profiles
    for (const profile of updatedProfiles) {
      await indexedDBService.saveProfile(profile);
    }
  }

  generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createProfile(name: string, config: XtreamConfig): ProfileAccount {
    return {
      id: this.generateProfileId(),
      name,
      config,
      isActive: false,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
  }

  async updateProfileLastUsed(profileId: string): Promise<void> {
    const profile = await indexedDBService.getProfile(profileId);
    if (profile) {
      profile.lastUsed = new Date().toISOString();
      await indexedDBService.saveProfile(profile);
    }
  }

  async updateProfileUserData(
    profileId: string,
    userProfile: any,
    serverInfo: any
  ): Promise<void> {
    const profile = await indexedDBService.getProfile(profileId);
    if (profile) {
      profile.userProfile = userProfile;
      profile.serverInfo = serverInfo;
      await indexedDBService.saveProfile(profile);
    }
  }
}

// Singleton instance
export const profileServiceIndexedDB = new ProfileServiceIndexedDB();
