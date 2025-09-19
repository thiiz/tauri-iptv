import type { ProfileAccount } from '@/types/iptv';
import { invoke } from '@tauri-apps/api/core';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ProfileService {
  async saveProfile(profile: ProfileAccount): Promise<void> {
    const response = await invoke<ApiResponse<void>>('save_profile_account', {
      profile
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to save profile');
    }
  }

  async getProfiles(): Promise<ProfileAccount[]> {
    const response = await invoke<ApiResponse<ProfileAccount[]>>(
      'get_profile_accounts'
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get profiles');
    }

    return response.data || [];
  }

  async deleteProfile(profileId: string): Promise<void> {
    const response = await invoke<ApiResponse<void>>('delete_profile_account', {
      profileId
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete profile');
    }
  }

  generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createProfile(name: string, config: any): ProfileAccount {
    return {
      id: this.generateProfileId(),
      name,
      config,
      isActive: false,
      createdAt: new Date().toISOString()
    };
  }
}

export const profileService = new ProfileService();
