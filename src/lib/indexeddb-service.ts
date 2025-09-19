import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  ProfileAccount,
  Category,
  Channel,
  Movie,
  Show,
  Episode,
  FavoriteItem,
  WatchHistory,
  AppSettings,
  UserProfile,
  ServerInfo
} from '@/types/iptv';

interface IPTVDBSchema extends DBSchema {
  profiles: {
    key: string;
    value: ProfileAccount;
    indexes: { 'by-isActive': boolean };
  };
  categories: {
    key: string;
    value: Category & { type: 'channel' | 'movie' | 'show' };
    indexes: { 'by-type': 'channel' | 'movie' | 'show' };
  };
  channels: {
    key: string;
    value: Channel;
    indexes: { 'by-categoryId': string };
  };
  movies: {
    key: string;
    value: Movie;
    indexes: { 'by-categoryId': string };
  };
  shows: {
    key: string;
    value: Show;
    indexes: { 'by-categoryId': string };
  };
  episodes: {
    key: string;
    value: Episode;
    indexes: { 'by-showId': string };
  };
  favorites: {
    key: string;
    value: FavoriteItem;
    indexes: { 'by-type': 'channel' | 'movie' | 'show' };
  };
  watchHistory: {
    key: string;
    value: WatchHistory;
    indexes: {
      'by-type': 'channel' | 'movie' | 'episode';
      'by-watchedAt': string;
    };
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

    this.dbPromise = openDB<IPTVDBSchema>('iptv-db', 1, {
      upgrade(db) {
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
        }

        // Channels store
        if (!db.objectStoreNames.contains('channels')) {
          const channelsStore = db.createObjectStore('channels', {
            keyPath: 'id'
          });
          channelsStore.createIndex('by-categoryId', 'categoryId');
        }

        // Movies store
        if (!db.objectStoreNames.contains('movies')) {
          const moviesStore = db.createObjectStore('movies', { keyPath: 'id' });
          moviesStore.createIndex('by-categoryId', 'categoryId');
        }

        // Shows store
        if (!db.objectStoreNames.contains('shows')) {
          const showsStore = db.createObjectStore('shows', { keyPath: 'id' });
          showsStore.createIndex('by-categoryId', 'categoryId');
        }

        // Episodes store
        if (!db.objectStoreNames.contains('episodes')) {
          const episodesStore = db.createObjectStore('episodes', {
            keyPath: 'id'
          });
          episodesStore.createIndex('by-showId', 'showId');
        }

        // Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          const favoritesStore = db.createObjectStore('favorites', {
            keyPath: 'id'
          });
          favoritesStore.createIndex('by-type', 'type');
        }

        // Watch History store
        if (!db.objectStoreNames.contains('watchHistory')) {
          const watchHistoryStore = db.createObjectStore('watchHistory', {
            keyPath: 'id'
          });
          watchHistoryStore.createIndex('by-type', 'type');
          watchHistoryStore.createIndex('by-watchedAt', 'watchedAt');
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
    categories: Category[]
  ): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('categories', 'readwrite');

    // Delete existing categories of this type
    const existingCategories = await tx.store.index('by-type').getAll(type);
    for (const category of existingCategories) {
      await tx.store.delete(category.id);
    }

    // Add new categories
    for (const category of categories) {
      await tx.store.put({ ...category, type });
    }

    await tx.done;
  }

  async getCategories(type: 'channel' | 'movie' | 'show'): Promise<Category[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    const categories = await db.getAllFromIndex('categories', 'by-type', type);
    return categories.map(({ type: _, ...category }) => category);
  }

  // Channel methods
  async saveChannels(channels: Channel[]): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('channels', 'readwrite');

    // Clear existing channels
    await tx.store.clear();

    // Add new channels
    for (const channel of channels) {
      await tx.store.put(channel);
    }

    await tx.done;
  }

  async getChannels(categoryId?: string): Promise<Channel[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    if (categoryId) {
      return await db.getAllFromIndex('channels', 'by-categoryId', categoryId);
    }
    return await db.getAll('channels');
  }

  async getChannel(channelId: string): Promise<Channel | undefined> {
    const db = await this.ensureDB();
    if (!db) return undefined;
    return await db.get('channels', channelId);
  }

  // Movie methods
  async saveMovies(movies: Movie[]): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('movies', 'readwrite');

    // Clear existing movies
    await tx.store.clear();

    // Add new movies
    for (const movie of movies) {
      await tx.store.put(movie);
    }

    await tx.done;
  }

  async getMovies(categoryId?: string): Promise<Movie[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    if (categoryId) {
      return await db.getAllFromIndex('movies', 'by-categoryId', categoryId);
    }
    return await db.getAll('movies');
  }

  async getMovie(movieId: string): Promise<Movie | undefined> {
    const db = await this.ensureDB();
    if (!db) return undefined;
    return await db.get('movies', movieId);
  }

  // Show methods
  async saveShows(shows: Show[]): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('shows', 'readwrite');

    // Clear existing shows
    await tx.store.clear();

    // Add new shows
    for (const show of shows) {
      await tx.store.put(show);
    }

    await tx.done;
  }

  async getShows(categoryId?: string): Promise<Show[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    if (categoryId) {
      return await db.getAllFromIndex('shows', 'by-categoryId', categoryId);
    }
    return await db.getAll('shows');
  }

  async getShow(showId: string): Promise<Show | undefined> {
    const db = await this.ensureDB();
    if (!db) return undefined;
    return await db.get('shows', showId);
  }

  // Episode methods
  async saveEpisodes(showId: string, episodes: Episode[]): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    const tx = db.transaction('episodes', 'readwrite');

    // Delete existing episodes for this show
    const existingEpisodes = await tx.store.index('by-showId').getAll(showId);
    for (const episode of existingEpisodes) {
      await tx.store.delete(episode.id);
    }

    // Add new episodes
    for (const episode of episodes) {
      await tx.store.put({ ...episode, showId });
    }

    await tx.done;
  }

  async getEpisodes(showId: string): Promise<Episode[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    const episodes = await db.getAllFromIndex('episodes', 'by-showId', showId);
    return episodes.map(({ showId: _, ...episode }) => episode);
  }

  // Favorites methods
  async addFavorite(item: FavoriteItem): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    await db.put('favorites', item);
  }

  async removeFavorite(id: string): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    await db.delete('favorites', id);
  }

  async getFavorites(
    type?: 'channel' | 'movie' | 'show'
  ): Promise<FavoriteItem[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    if (type) {
      return await db.getAllFromIndex('favorites', 'by-type', type);
    }
    return await db.getAll('favorites');
  }

  async isFavorite(id: string): Promise<boolean> {
    const db = await this.ensureDB();
    if (!db) return false;
    const item = await db.get('favorites', id);
    return !!item;
  }

  // Watch History methods
  async addToHistory(item: WatchHistory): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    await db.put('watchHistory', item);
  }

  async getWatchHistory(
    type?: 'channel' | 'movie' | 'episode',
    limit = 100
  ): Promise<WatchHistory[]> {
    const db = await this.ensureDB();
    if (!db) return [];
    let history: WatchHistory[];

    if (type) {
      history = await db.getAllFromIndex('watchHistory', 'by-type', type);
    } else {
      history = await db.getAll('watchHistory');
    }

    // Sort by watchedAt descending and limit
    return history
      .sort(
        (a, b) =>
          new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
      )
      .slice(0, limit);
  }

  async clearWatchHistory(): Promise<void> {
    const db = await this.ensureDB();
    if (!db) return;
    await db.clear('watchHistory');
  }

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
      ['channels', 'movies', 'shows', 'episodes', 'favorites', 'watchHistory'],
      'readwrite'
    );

    await Promise.all([
      tx.objectStore('channels').clear(),
      tx.objectStore('movies').clear(),
      tx.objectStore('shows').clear(),
      tx.objectStore('episodes').clear(),
      tx.objectStore('favorites').clear(),
      tx.objectStore('watchHistory').clear()
    ]);

    await tx.done;
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
