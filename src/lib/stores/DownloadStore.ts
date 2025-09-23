import type { Channel, Movie, Show } from '@/types/iptv';
import { create } from 'zustand';
import { iptvDataService } from '../iptv-data-service';

interface DownloadStore {
  // Download State
  downloadProgress: {
    channels: { isDownloading: boolean; progress: number; total: number };
    movies: { isDownloading: boolean; progress: number; total: number };
    shows: { isDownloading: boolean; progress: number; total: number };
  };
  contentDownloaded: {
    channels: boolean;
    movies: boolean;
    shows: boolean;
  };

  // Download actions
  downloadChannels: () => Promise<void>;
  downloadMovies: () => Promise<void>;
  downloadShows: () => Promise<void>;
  downloadAllContent: () => Promise<void>;
  checkContentDownloaded: () => Promise<void>;
}

export const useDownloadStore = create<DownloadStore>()((set, get) => ({
  // Initial state
  downloadProgress: {
    channels: { isDownloading: false, progress: 0, total: 0 },
    movies: { isDownloading: false, progress: 0, total: 0 },
    shows: { isDownloading: false, progress: 0, total: 0 }
  },
  contentDownloaded: {
    channels: false,
    movies: false,
    shows: false
  },

  // Download actions
  downloadChannels: async () => {
    // Assume currentProfileId from ProfileStore
    // const { currentProfileId } = useProfileStore.getState();
    // if (!currentProfileId) return;

    set((state) => ({
      downloadProgress: {
        ...state.downloadProgress,
        channels: { isDownloading: true, progress: 0, total: 0 }
      }
    }));

    try {
      const categories = await iptvDataService.getChannelCategories(true);
      const allChannels: Channel[] = [];

      for (const category of categories) {
        const channels = await iptvDataService.getChannels(
          { categoryId: category.id },
          true
        );
        allChannels.push(...channels);

        set((state) => ({
          downloadProgress: {
            ...state.downloadProgress,
            channels: {
              ...state.downloadProgress.channels,
              progress: allChannels.length,
              total: allChannels.length + 1 // Estimate
            }
          }
        }));
      }

      // await indexedDBService.saveCategories('channel', categories, currentProfileId);
      // await indexedDBService.downloadChannels(currentProfileId, allChannels);

      set((state) => ({
        downloadProgress: {
          ...state.downloadProgress,
          channels: {
            isDownloading: false,
            progress: allChannels.length,
            total: allChannels.length
          }
        },
        contentDownloaded: {
          ...state.contentDownloaded,
          channels: true
        }
      }));
    } catch (error) {
      set((state) => ({
        downloadProgress: {
          ...state.downloadProgress,
          channels: { isDownloading: false, progress: 0, total: 0 }
        }
      }));
      console.error('Failed to download channels:', error);
      throw error;
    }
  },

  downloadMovies: async () => {
    // Similar to downloadChannels
    set((state) => ({
      downloadProgress: {
        ...state.downloadProgress,
        movies: { isDownloading: true, progress: 0, total: 0 }
      }
    }));

    try {
      const categories = await iptvDataService.getMovieCategories(true);
      const allMovies: Movie[] = [];

      for (const category of categories) {
        const movies = await iptvDataService.getMovies(
          { categoryId: category.id },
          true
        );
        allMovies.push(...movies);

        set((state) => ({
          downloadProgress: {
            ...state.downloadProgress,
            movies: {
              ...state.downloadProgress.movies,
              progress: allMovies.length,
              total: allMovies.length + 1
            }
          }
        }));
      }

      set((state) => ({
        downloadProgress: {
          ...state.downloadProgress,
          movies: {
            isDownloading: false,
            progress: allMovies.length,
            total: allMovies.length
          }
        },
        contentDownloaded: {
          ...state.contentDownloaded,
          movies: true
        }
      }));
    } catch (error) {
      set((state) => ({
        downloadProgress: {
          ...state.downloadProgress,
          movies: { isDownloading: false, progress: 0, total: 0 }
        }
      }));
      console.error('Failed to download movies:', error);
      throw error;
    }
  },

  downloadShows: async () => {
    set((state) => ({
      downloadProgress: {
        ...state.downloadProgress,
        shows: { isDownloading: true, progress: 0, total: 0 }
      }
    }));

    try {
      const categories = await iptvDataService.getShowCategories(true);
      const allShows: Show[] = [];

      for (const category of categories) {
        const shows = await iptvDataService.getShows(
          { categoryId: category.id },
          true
        );
        allShows.push(...shows);

        set((state) => ({
          downloadProgress: {
            ...state.downloadProgress,
            shows: {
              ...state.downloadProgress.shows,
              progress: allShows.length,
              total: allShows.length + 1
            }
          }
        }));
      }

      set((state) => ({
        downloadProgress: {
          ...state.downloadProgress,
          shows: {
            isDownloading: false,
            progress: allShows.length,
            total: allShows.length
          }
        },
        contentDownloaded: {
          ...state.contentDownloaded,
          shows: true
        }
      }));
    } catch (error) {
      set((state) => ({
        downloadProgress: {
          ...state.downloadProgress,
          shows: { isDownloading: false, progress: 0, total: 0 }
        }
      }));
      console.error('Failed to download shows:', error);
      throw error;
    }
  },

  downloadAllContent: async () => {
    await Promise.all([
      get().downloadChannels(),
      get().downloadMovies(),
      get().downloadShows()
    ]);
  },

  checkContentDownloaded: async () => {
    // const { currentProfileId } = useProfileStore.getState();
    // if (!currentProfileId) return;

    try {
      // const status = await indexedDBService.getDownloadStatus(currentProfileId);
      // set({ contentDownloaded: status });
    } catch (error) {
      console.error('Failed to check download status:', error);
    }
  }
}));
