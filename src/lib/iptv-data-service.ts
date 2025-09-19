import type {
  XtreamConfig,
  UserProfile,
  ServerInfo,
  Category,
  Channel,
  Movie,
  MovieDetails,
  Show,
  ShowDetails,
  Episode,
  EPGProgram,
  StreamOptions,
  ProfileAccount
} from '@/types/iptv';
import { invoke } from '@tauri-apps/api/core';
import { indexedDBService } from './indexeddb-service';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class IPTVDataService {
  private config: XtreamConfig | null = null;
  private currentProfile: ProfileAccount | null = null;
  private dbInitialized = false;

  constructor() {
    // Initialize IndexedDB lazily when needed
  }

  private async ensureDBInitialized(): Promise<void> {
    if (!this.dbInitialized) {
      await indexedDBService.init();
      this.dbInitialized = true;
    }
  }

  async initialize(config: XtreamConfig): Promise<void> {
    this.config = config;
  }

  async initializeWithProfile(profile: ProfileAccount): Promise<void> {
    this.currentProfile = profile;
    await this.initialize(profile.config);
  }

  private ensureInitialized(): void {
    if (!this.config) {
      throw new Error('IPTV service not initialized. Call initialize() first.');
    }
  }

  private async makeRequest(
    action: string,
    additionalParams: Record<string, string> = {}
  ): Promise<any> {
    this.ensureInitialized();

    const params = {
      username: this.config!.username,
      password: this.config!.password,
      action,
      ...additionalParams
    };

    // Ensure URL ends with player_api.php
    let apiUrl = this.config!.url;
    if (!apiUrl.endsWith('/player_api.php')) {
      apiUrl = apiUrl.replace(/\/$/, '') + '/player_api.php';
    }

    const response = await invoke<ApiResponse<any>>('iptv_request', {
      url: apiUrl,
      params
    });

    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }

    return response.data;
  }

  // Profile and Server Info methods
  async getUserProfile(forceRefresh = false): Promise<UserProfile> {
    this.ensureInitialized();

    if (!forceRefresh) {
      // Try to get from profile data first
      if (this.currentProfile?.userProfile) {
        return this.currentProfile.userProfile;
      }
    }

    try {
      const profile = await this.makeRequest('get_profile');
      const userProfile: UserProfile = {
        id: profile.user_info?.id || '',
        username: profile.user_info?.username || '',
        password: profile.user_info?.password || '',
        email: profile.user_info?.email || '',
        expDate: profile.user_info?.exp_date || '',
        isActive: profile.user_info?.status === 'Active',
        createdAt: profile.user_info?.created_at || '',
        maxConnections: profile.user_info?.max_connections || 1,
        allowedOutputFormats: profile.user_info?.allowed_output_formats || []
      };

      // Update profile in IndexedDB if we have a current profile
      if (this.currentProfile) {
        this.currentProfile.userProfile = userProfile;
        await this.ensureDBInitialized();
        await indexedDBService.saveProfile(this.currentProfile);
      }

      return userProfile;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  async getServerInfo(forceRefresh = false): Promise<ServerInfo> {
    this.ensureInitialized();

    if (!forceRefresh) {
      // Try to get from profile data first
      if (this.currentProfile?.serverInfo) {
        return this.currentProfile.serverInfo;
      }
    }

    try {
      const info = await this.makeRequest('get_profile');
      const serverInfo = info.server_info || {};
      const serverInfoFormatted: ServerInfo = {
        url: serverInfo.url || '',
        port: serverInfo.port || '',
        httpsPort: serverInfo.https_port || '',
        serverProtocol: serverInfo.server_protocol || '',
        rtmpPort: serverInfo.rtmp_port || '',
        timezone: serverInfo.timezone || '',
        timestampNow: serverInfo.timestamp_now || Date.now(),
        timeNow: serverInfo.time_now || new Date().toISOString()
      };

      // Update profile in IndexedDB if we have a current profile
      if (this.currentProfile) {
        this.currentProfile.serverInfo = serverInfoFormatted;
        await indexedDBService.saveProfile(this.currentProfile);
      }

      return serverInfoFormatted;
    } catch (error) {
      console.error('Failed to get server info:', error);
      throw new Error('Failed to get server info');
    }
  }

  // Category methods with caching
  async getChannelCategories(forceRefresh = false): Promise<Category[]> {
    if (!forceRefresh) {
      await this.ensureDBInitialized();
      const cached = await indexedDBService.getCategories('channel');
      if (cached.length > 0) {
        return cached;
      }
    }

    this.ensureInitialized();
    try {
      const categories = await this.makeRequest('get_live_categories');
      if (!Array.isArray(categories)) {
        console.warn('Categories response is not an array:', categories);
        return [];
      }
      const formattedCategories = categories.map((cat: any) => ({
        id: cat.category_id,
        name: cat.category_name,
        parentId: cat.parent_id
      }));

      await this.ensureDBInitialized();
      await indexedDBService.saveCategories('channel', formattedCategories);
      return formattedCategories;
    } catch (error) {
      console.error('Failed to get channel categories:', error);
      throw new Error('Failed to get channel categories');
    }
  }

  async getMovieCategories(forceRefresh = false): Promise<Category[]> {
    if (!forceRefresh) {
      const cached = await indexedDBService.getCategories('movie');
      if (cached.length > 0) {
        return cached;
      }
    }

    this.ensureInitialized();
    try {
      const categories = await this.xtream!.getMovieCategories();
      const formattedCategories = categories.map((cat: any) => ({
        id: cat.id || cat.category_id,
        name: cat.name || cat.category_name,
        parentId: cat.parentId || cat.parent_id
      }));

      await indexedDBService.saveCategories('movie', formattedCategories);
      return formattedCategories;
    } catch (error) {
      console.error('Failed to get movie categories:', error);
      throw new Error('Failed to get movie categories');
    }
  }

  async getShowCategories(forceRefresh = false): Promise<Category[]> {
    if (!forceRefresh) {
      const cached = await indexedDBService.getCategories('show');
      if (cached.length > 0) {
        return cached;
      }
    }

    this.ensureInitialized();
    try {
      const categories = await this.xtream!.getShowCategories();
      const formattedCategories = categories.map((cat: any) => ({
        id: cat.id || cat.category_id,
        name: cat.name || cat.category_name,
        parentId: cat.parentId || cat.parent_id
      }));

      await indexedDBService.saveCategories('show', formattedCategories);
      return formattedCategories;
    } catch (error) {
      console.error('Failed to get show categories:', error);
      throw new Error('Failed to get show categories');
    }
  }

  // Content methods with caching
  async getChannels(
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh = false
  ): Promise<Channel[]> {
    if (!forceRefresh) {
      await this.ensureDBInitialized();
      const cached = await indexedDBService.getChannels(options?.categoryId);
      if (cached.length > 0) {
        return cached;
      }
    }

    this.ensureInitialized();
    try {
      const params: Record<string, string> = {};
      if (options?.categoryId) {
        params.category_id = options.categoryId;
      }

      const channels = await this.makeRequest('get_live_streams', params);
      if (!Array.isArray(channels)) {
        console.warn('Channels response is not an array:', channels);
        return [];
      }
      const formattedChannels = channels.map((ch: any) => ({
        id: ch.stream_id,
        name: ch.name,
        streamType: ch.stream_type,
        streamIcon: ch.stream_icon,
        epgChannelId: ch.epg_channel_id,
        added: ch.added,
        categoryId: ch.category_id,
        customSid: ch.custom_sid,
        tvArchive: ch.tv_archive || 0,
        directSource: ch.direct_source,
        tvArchiveDuration: ch.tv_archive_duration
      }));

      await this.ensureDBInitialized();
      await indexedDBService.saveChannels(formattedChannels);
      return formattedChannels;
    } catch (error) {
      console.error('Failed to get channels:', error);
      throw new Error('Failed to get channels');
    }
  }

  async getMovies(
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh = false
  ): Promise<Movie[]> {
    if (!forceRefresh) {
      await this.ensureDBInitialized();
      const cached = await indexedDBService.getMovies(options?.categoryId);
      if (cached.length > 0) {
        return cached;
      }
    }

    this.ensureInitialized();
    try {
      const params: Record<string, string> = {};
      if (options?.categoryId) {
        params.category_id = options.categoryId;
      }

      const movies = await this.makeRequest('get_vod_streams', params);
      if (!Array.isArray(movies)) {
        console.warn('Movies response is not an array:', movies);
        return [];
      }
      const formattedMovies = movies.map((movie: any) => ({
        id: movie.stream_id,
        name: movie.name,
        streamType: movie.stream_type,
        streamIcon: movie.stream_icon,
        rating: movie.rating,
        year: movie.year,
        added: movie.added,
        categoryId: movie.category_id,
        containerExtension: movie.container_extension,
        customSid: movie.custom_sid,
        directSource: movie.direct_source
      }));

      await this.ensureDBInitialized();
      await indexedDBService.saveMovies(formattedMovies);
      return formattedMovies;
    } catch (error) {
      console.error('Failed to get movies:', error);
      throw new Error('Failed to get movies');
    }
  }

  async getMovieDetails(
    movieId: string,
    forceRefresh = false
  ): Promise<MovieDetails> {
    if (!forceRefresh) {
      const cached = await indexedDBService.getMovie(movieId);
      if (cached && 'plot' in cached) {
        return cached as MovieDetails;
      }
    }

    this.ensureInitialized();
    try {
      const movie = await this.xtream!.getMovie({ movieId });
      const movieDetails: MovieDetails = {
        id: movie.id || movie.stream_id,
        name: movie.name,
        streamType: movie.streamType || movie.stream_type,
        streamIcon: movie.streamIcon || movie.stream_icon,
        rating: movie.rating,
        year: movie.year,
        added: movie.added,
        categoryId: movie.categoryId || movie.category_id,
        containerExtension:
          movie.containerExtension || movie.container_extension,
        customSid: movie.customSid || movie.custom_sid,
        directSource: movie.directSource || movie.direct_source,
        plot: movie.plot,
        cast: movie.cast,
        director: movie.director,
        genre: movie.genre,
        releaseDate: movie.releaseDate || movie.release_date,
        lastModified: movie.lastModified || movie.last_modified,
        rating5based: movie.rating5based || movie.rating_5based,
        backdropPath: movie.backdropPath || movie.backdrop_path,
        youtubeTrailer: movie.youtubeTrailer || movie.youtube_trailer,
        tmdbId: movie.tmdbId || movie.tmdb_id,
        imdbId: movie.imdbId || movie.imdb_id
      };

      // Update the movie in IndexedDB with full details
      await indexedDBService.saveMovies([movieDetails]);

      return movieDetails;
    } catch (error) {
      console.error('Failed to get movie details:', error);
      throw new Error('Failed to get movie details');
    }
  }

  async getShows(
    options?: { categoryId?: string; page?: number; limit?: number },
    forceRefresh = false
  ): Promise<Show[]> {
    if (!forceRefresh) {
      const cached = await indexedDBService.getShows(options?.categoryId);
      if (cached.length > 0) {
        return cached;
      }
    }

    this.ensureInitialized();
    try {
      const shows = await this.xtream!.getShows(options);
      const formattedShows = shows.map((show: any) => ({
        id: show.id || show.series_id,
        name: show.name,
        streamType: show.streamType || show.stream_type,
        streamIcon: show.streamIcon || show.stream_icon,
        rating: show.rating,
        year: show.year,
        added: show.added,
        categoryId: show.categoryId || show.category_id,
        lastModified: show.lastModified || show.last_modified
      }));

      await indexedDBService.saveShows(formattedShows);
      return formattedShows;
    } catch (error) {
      console.error('Failed to get shows:', error);
      throw new Error('Failed to get shows');
    }
  }

  async getShowDetails(
    showId: string,
    forceRefresh = false
  ): Promise<ShowDetails> {
    if (!forceRefresh) {
      const cached = await indexedDBService.getShow(showId);
      if (cached && 'episodes' in cached) {
        return cached as ShowDetails;
      }
    }

    this.ensureInitialized();
    try {
      const show = await this.xtream!.getShow({ showId });
      const showDetails: ShowDetails = {
        id: show.id || show.series_id,
        name: show.name,
        streamType: show.streamType || show.stream_type,
        streamIcon: show.streamIcon || show.stream_icon,
        rating: show.rating,
        year: show.year,
        added: show.added,
        categoryId: show.categoryId || show.category_id,
        lastModified: show.lastModified || show.last_modified,
        plot: show.plot,
        cast: show.cast,
        director: show.director,
        genre: show.genre,
        releaseDate: show.releaseDate || show.release_date,
        rating5based: show.rating5based || show.rating_5based,
        backdropPath: show.backdropPath || show.backdrop_path,
        youtubeTrailer: show.youtubeTrailer || show.youtube_trailer,
        tmdbId: show.tmdbId || show.tmdb_id,
        imdbId: show.imdbId || show.imdb_id,
        episodes: show.episodes || []
      };

      // Update the show in IndexedDB with full details
      await indexedDBService.saveShows([showDetails]);

      // Save episodes if available
      if (showDetails.episodes && showDetails.episodes.length > 0) {
        await indexedDBService.saveEpisodes(showId, showDetails.episodes);
      }

      return showDetails;
    } catch (error) {
      console.error('Failed to get show details:', error);
      throw new Error('Failed to get show details');
    }
  }

  async getEpisodes(showId: string, forceRefresh = false): Promise<Episode[]> {
    if (!forceRefresh) {
      const cached = await indexedDBService.getEpisodes(showId);
      if (cached.length > 0) {
        return cached;
      }
    }

    // Get show details which includes episodes
    const showDetails = await this.getShowDetails(showId, forceRefresh);
    return showDetails.episodes || [];
  }

  // EPG methods
  async getShortEPG(channelId: string, limit?: number): Promise<EPGProgram[]> {
    this.ensureInitialized();
    try {
      const epg = await this.xtream!.getShortEPG({ channelId, limit });
      return epg.map((program: any) => ({
        id: program.id,
        title: program.title,
        description: program.description,
        start: program.start,
        stop: program.stop,
        channelId: program.channelId || channelId
      }));
    } catch (error) {
      console.error('Failed to get short EPG:', error);
      throw new Error('Failed to get EPG data');
    }
  }

  async getFullEPG(channelId: string): Promise<EPGProgram[]> {
    this.ensureInitialized();
    try {
      const epg = await this.xtream!.getFullEPG({ channelId });
      return epg.map((program: any) => ({
        id: program.id,
        title: program.title,
        description: program.description,
        start: program.start,
        stop: program.stop,
        channelId: program.channelId || channelId
      }));
    } catch (error) {
      console.error('Failed to get full EPG:', error);
      throw new Error('Failed to get EPG data');
    }
  }

  // Stream URL generation
  generateStreamUrl(options: StreamOptions): string {
    this.ensureInitialized();
    try {
      const { type, streamId, extension } = options;
      const baseUrl = this.config!.url.replace('/player_api.php', '');

      switch (type) {
        case 'channel':
          return `${baseUrl}/live/${this.config!.username}/${this.config!.password}/${streamId}.${extension}`;
        case 'movie':
          return `${baseUrl}/movie/${this.config!.username}/${this.config!.password}/${streamId}.${extension}`;
        case 'episode':
          return `${baseUrl}/series/${this.config!.username}/${this.config!.password}/${streamId}.${extension}`;
        default:
          throw new Error('Invalid stream type');
      }
    } catch (error) {
      console.error('Failed to generate stream URL:', error);
      throw new Error('Failed to generate stream URL');
    }
  }

  // Connection testing
  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();

      const response = await invoke<ApiResponse<any>>('test_iptv_connection', {
        config: {
          url: this.config!.url,
          username: this.config!.username,
          password: this.config!.password,
          preferredFormat: this.config!.preferredFormat
        }
      });

      return response.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Utility methods
  getConfig(): XtreamConfig | null {
    return this.config;
  }

  getCurrentProfile(): ProfileAccount | null {
    return this.currentProfile;
  }

  async refreshAllData(): Promise<void> {
    // Force refresh all cached data
    await Promise.all([
      this.getChannelCategories(true),
      this.getMovieCategories(true),
      this.getShowCategories(true),
      this.getChannels({}, true),
      this.getMovies({}, true),
      this.getShows({}, true)
    ]);
  }

  async clearCache(): Promise<void> {
    await indexedDBService.clearAllData();
  }
}

// Singleton instance
export const iptvDataService = new IPTVDataService();
