import type {
  AppSettings,
  Category,
  Channel,
  Episode,
  Movie,
  ProfileAccount,
  Show
} from '@/types/iptv';
import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface IPTVDBSchema extends DBSchema {
  profiles: {
    key: string;
    value: ProfileAccount;
    indexes: { 'by-isActive': boolean };
  };
  categories: {
    key: string;
    value: Category & { type: 'channel' | 'movie' | 'show'; profileId: string };
    indexes: { 'by-type': 'channel' | 'movie' | 'show'; 'by-profile': string };
  };
  channels: {
    key: string;
    value: Channel & { profileId: string };
    indexes: { 'by-categoryId': string; 'by-profile': string };
  };
  movies: {
    key: string;
    value: Movie & { profileId: string };
    indexes: { 'by-categoryId': string; 'by-profile': string };
  };
  shows: {
    key: string;
    value: Show & { profileId: string };
    indexes: { 'by-categoryId': string; 'by-profile': string };
  };
  episodes: {
    key: string;
    value: Episode & { profileId: string; showId: string };
    indexes: { 'by-showId': string; 'by-profile': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

export class IndexedDBService {
  private db: IDBPDatabase<IPTVDBSchema> | null = null;
  private dbPromise: Promise<IDBPDatabase<IPTVDBSchema>> | null = null;

  async init(): Promise<void> {
    // Check if we're in the browser
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB is not available');
      return;
    }

    if (this.dbPromise) {
      await this.dbPromise;
      return;
    }

    this.dbPromise = openDB<IPTVDBSchema>('iptv-db', 2, {
      upgrade(db, oldVersion, newVersion) {
        // If upgrading from version 1, we need to recreate stores with new schema
        if (oldVersion < 2) {
          // Delete existing stores if they exist
          const storeNames = [
            'profiles',
            'categories',
            'channels',
            'movies',
            'shows',
            'episodes',
            'settings'
          ];
          storeNames.forEach((storeName) => {
            if (db.objectStoreNames.contains(storeName)) {
              db.deleteObjectStore(storeName);
            }
          });
        }

        // Profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          const profilesStore = db.createObjectStore('profiles', {
            keyPath: 'id'
          });
          profilesStore.createIndex('by-isActive', 'isActive');
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoriesStore = db.createObjectStore('categories', {
            keyPath: 'id'
          });
          categoriesStore.createIndex('by-type', 'type');
          categoriesStore.createIndex('by-profile', 'profileId');
        }

        // Channels store
        if (!db.objectStoreNames.contains('channels')) {
          const channelsStore = db.createObjectStore('channels', {
            keyPath: 'id'
          });
          channelsStore.createIndex('by-categoryId', 'categoryId');
          channelsStore.createIndex('by-profile', 'profileId');
        }

        // Movies store
        if (!db.objectStoreNames.contains('movies')) {
          const moviesStore = db.createObjectStore('movies', { keyPath: 'id' });
          moviesStore.createIndex('by-categoryId', 'categoryId');
          moviesStore.createIndex('by-profile', 'profileId');
        }

        // Shows store
        if (!db.objectStoreNames.contains('shows')) {
          const showsStore = db.createObjectStore('shows', { keyPath: 'id' });
          showsStore.createIndex('by-categoryId', 'categoryId');
          showsStore.createIndex('by-profile', 'profileId');
        }

        // Episodes store
        if (!db.objectStoreNames.contains('episodes')) {
          const episodesStore = db.createObjectStore('episodes', {
            keyPath: 'id'
          });
          episodesStore.createIndex('by-showId', 'showId');
          episodesStore.createIndex('by-profile', 'profileId');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      }
    });

    this.db = await this.dbPromise;
  }

  private async ensureDB(): Promise<IDBPDatabase<IPTVDBSchema> | null> {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  // Profile methods
  async saveProfile(profile: ProfileAccount): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    await db.put('profiles', profile);
  }

  async getProfiles(): Promise<ProfileAccount[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    return await db.getAll('profiles');
  }

  async getProfile(profileId: string): Promise<ProfileAccount | undefined> {
    const db = await this.ensureDB();
    if (!db) return undefined;
    return await db.get('profiles', profileId);
  }

  async deleteProfile(profileId: string): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    await db.delete('profiles', profileId);
  }

  async getActiveProfile(): Promise<ProfileAccount | undefined> {
    const db = await this.ensureDB();
    if (!db) return undefined;
    const profiles = await db.getAllFromIndex('profiles', 'by-isActive', true);
    return profiles[0];
  }

  // Category methods
  async saveCategories(
    type: 'channel' | 'movie' | 'show',
    categories: Category[],
    profileId: string
  ): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('categories', 'readwrite');

    // Delete existing categories of this type for this profile
    const existingCategories = await tx.store.index('by-type').getAll(type);
    const profileCategories = existingCategories.filter(
      (cat) => cat.profileId === profileId
    );
    for (const category of profileCategories) {
      await tx.store.delete(category.id);
    }

    // Add new categories
    for (const category of categories) {
      await tx.store.put({ ...category, type, profileId });
    }

    await tx.done;
  }

  async getCategories(
    type: 'channel' | 'movie' | 'show',
    profileId?: string
  ): Promise<Category[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    const categories = await db.getAllFromIndex('categories', 'by-type', type);
    const filteredCategories = profileId
      ? categories.filter((cat) => cat.profileId === profileId)
      : categories;
    return filteredCategories.map(
      ({ type: _, profileId: __, ...category }) => category
    );
  }

  // Channel methods
  async saveChannels(channels: Channel[], profileId: string): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('channels', 'readwrite');

    // Clear existing channels for this profile
    const existingChannels = await tx.store
      .index('by-profile')
      .getAll(profileId);
    for (const channel of existingChannels) {
      await tx.store.delete(channel.id);
    }

    // Add new channels
    for (const channel of channels) {
      await tx.store.put({ ...channel, profileId });
    }

    await tx.done;
  }

  async getChannels(
    categoryId?: string,
    profileId?: string
  ): Promise<Channel[]> {
    const db = await this.ensureDB();
    if (!db) return [];

    let channels: (Channel & { profileId: string })[];
    if (categoryId) {
      channels = await db.getAllFromIndex(
        'channels',
        'by-categoryId',
        categoryId
      );
    } else {
      channels = await db.getAll('channels');
    }

    // Filter by profile if specified
    if (profileId) {
      channels = channels.filter((ch) => ch.profileId === profileId);
    }

    return channels.map(({ profileId: _, ...channel }) => channel);
  }

  async getChannel(channelId: string): Promise<Channel | undefined> {
    const db = await this.ensureDB();
    if (!db) return undefined;
    return await db.get('channels', channelId);
  }

  // Movie methods
  async saveMovies(movies: Movie[], profileId: string): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('movies', 'readwrite');

    // Clear existing movies for this profile
    const existingMovies = await tx.store.index('by-profile').getAll(profileId);
    for (const movie of existingMovies) {
      await tx.store.delete(movie.id);
    }

    // Add new movies
    for (const movie of movies) {
      await tx.store.put({ ...movie, profileId });
    }

    await tx.done;
  }

  async getMovies(categoryId?: string, profileId?: string): Promise<Movie[]> {
    const db = await this.ensureDB();
    if (!db) return [];

    let movies: (Movie & { profileId: string })[];
    if (categoryId) {
      movies = await db.getAllFromIndex('movies', 'by-categoryId', categoryId);
    } else {
      movies = await db.getAll('movies');
    }

    // Filter by profile if specified
    if (profileId) {
      movies = movies.filter((movie) => movie.profileId === profileId);
    }

    return movies.map(({ profileId: _, ...movie }) => movie);
  }

  async getMovie(movieId: string): Promise<Movie | undefined> {
    const db = await this.ensureDB();
    if (!db) return undefined;
    return await db.get('movies', movieId);
  }

  // Show methods
  async saveShows(shows: Show[], profileId: string): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('shows', 'readwrite');

    // Clear existing shows for this profile
    const existingShows = await tx.store.index('by-profile').getAll(profileId);
    for (const show of existingShows) {
      await tx.store.delete(show.id);
    }

    // Add new shows
    for (const show of shows) {
      await tx.store.put({ ...show, profileId });
    }

    await tx.done;
  }

  async getShows(categoryId?: string, profileId?: string): Promise<Show[]> {
    const db = await this.ensureDB();
    if (!db) return [];

    let shows: (Show & { profileId: string })[];
    if (categoryId) {
      shows = await db.getAllFromIndex('shows', 'by-categoryId', categoryId);
    } else {
      shows = await db.getAll('shows');
    }

    // Filter by profile if specified
    if (profileId) {
      shows = shows.filter((show) => show.profileId === profileId);
    }

    return shows.map(({ profileId: _, ...show }) => show);
  }

  async getShow(showId: string): Promise<Show | undefined> {
    const db = await this.ensureDB();
    if (!db) return undefined;
    return await db.get('shows', showId);
  }

  // Episode methods
  async saveEpisodes(
    showId: string,
    episodes: Episode[],
    profileId: string
  ): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('episodes', 'readwrite');

    // Delete existing episodes for this show and profile
    const existingEpisodes = await tx.store.index('by-showId').getAll(showId);
    const profileEpisodes = existingEpisodes.filter(
      (ep) => ep.profileId === profileId
    );
    for (const episode of profileEpisodes) {
      await tx.store.delete(episode.id);
    }

    // Add new episodes
    for (const episode of episodes) {
      await tx.store.put({ ...episode, showId, profileId });
    }

    await tx.done;
  }

  async getEpisodes(showId: string, profileId?: string): Promise<Episode[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    const episodes = await db.getAllFromIndex('episodes', 'by-showId', showId);
    const filteredEpisodes = profileId
      ? episodes.filter((ep) => ep.profileId === profileId)
      : episodes;
    return filteredEpisodes.map(
      ({ showId: _, profileId: __, ...episode }) => episode
    );
  }

  // Watch History methods

  // Settings methods
  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    await db.put('settings', { key: 'app', ...settings });
  }

  async getSettings(): Promise<AppSettings | null> {
    const db = await this.ensureDB();
    if (!db) return null;
    const settings = await db.get('settings', 'app');
    if (!settings) return null;

    const { key, ...appSettings } = settings;
    return appSettings as AppSettings;
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction(
      ['channels', 'movies', 'shows', 'episodes'],
      'readwrite'
    );

    await Promise.all([
      tx.objectStore('channels').clear(),
      tx.objectStore('movies').clear(),
      tx.objectStore('shows').clear(),
      tx.objectStore('episodes').clear()
    ]);

    await tx.done;
  }

  // Download methods
  async downloadChannels(
    profileId: string,
    channels: Channel[]
  ): Promise<void> {
    await this.saveChannels(channels, profileId);
  }

  async downloadMovies(profileId: string, movies: Movie[]): Promise<void> {
    await this.saveMovies(movies, profileId);
  }

  async downloadShows(profileId: string, shows: Show[]): Promise<void> {
    await this.saveShows(shows, profileId);
  }

  // Check if content is downloaded for profile
  async isContentDownloaded(
    profileId: string,
    type: 'channels' | 'movies' | 'shows'
  ): Promise<boolean> {
    const db = await this.ensureDB();
    if (!db) return false;

    let count = 0;
    switch (type) {
      case 'channels':
        count = (await this.getChannels(undefined, profileId)).length;
        break;
      case 'movies':
        count = (await this.getMovies(undefined, profileId)).length;
        break;
      case 'shows':
        count = (await this.getShows(undefined, profileId)).length;
        break;
    }

    return count > 0;
  }

  // Get download status for all content types
  async getDownloadStatus(profileId: string): Promise<{
    channels: boolean;
    movies: boolean;
    shows: boolean;
  }> {
    const [channelsDownloaded, moviesDownloaded, showsDownloaded] =
      await Promise.all([
        this.isContentDownloaded(profileId, 'channels'),
        this.isContentDownloaded(profileId, 'movies'),
        this.isContentDownloaded(profileId, 'shows')
      ]);

    return {
      channels: channelsDownloaded,
      movies: moviesDownloaded,
      shows: showsDownloaded
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();
