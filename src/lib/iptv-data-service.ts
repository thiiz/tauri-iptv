import type {
  Category,
  Channel,
  EPGProgram,
  Episode,
  Movie,
  MovieDetails,
  ProfileAccount,
  ServerInfo,
  Show,
  ShowDetails,
  StreamOptions,
  UserProfile,
  XtreamConfig
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
    additionalParams: Record<string, string> = {},
    maxRetries = 3
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

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await invoke<ApiResponse<any>>('iptv_request', {
          url: apiUrl,
          params
        });

        if (!response.success) {
          throw new Error(response.error || 'Request failed');
        }

        return response.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(
          `Request attempt ${attempt + 1} failed:`,
          lastError.message
        );

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
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
      const cached = await indexedDBService.getCategories(
        'channel',
        this.currentProfile?.id
      );
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
      if (this.currentProfile) {
        await indexedDBService.saveCategories(
          'channel',
          formattedCategories,
          this.currentProfile.id
        );
      }
      return formattedCategories;
    } catch (error) {
      console.error('Failed to get channel categories:', error);
      throw new Error('Failed to get channel categories');
    }
  }

  async getMovieCategories(forceRefresh = false): Promise<Category[]> {
    if (!forceRefresh) {
      await this.ensureDBInitialized();
      const cached = await indexedDBService.getCategories(
        'movie',
        this.currentProfile?.id
      );
      if (cached.length > 0) {
        return cached;
      }
    }

    this.ensureInitialized();
    try {
      const categories = await this.makeRequest('get_vod_categories');
      if (!Array.isArray(categories)) {
        console.warn('Movie categories response is not an array:', categories);
        return [];
      }
      const formattedCategories = categories.map((cat: any) => ({
        id: cat.category_id,
        name: cat.category_name,
        parentId: cat.parent_id
      }));

      await this.ensureDBInitialized();
      if (this.currentProfile) {
        await indexedDBService.saveCategories(
          'movie',
          formattedCategories,
          this.currentProfile.id
        );
      }
      return formattedCategories;
    } catch (error) {
      console.error('Failed to get movie categories:', error);
      throw new Error('Failed to get movie categories');
    }
  }

  async getShowCategories(forceRefresh = false): Promise<Category[]> {
    if (!forceRefresh) {
      await this.ensureDBInitialized();
      const cached = await indexedDBService.getCategories(
        'show',
        this.currentProfile?.id
      );
      if (cached.length > 0) {
        return cached;
      }
    }

    this.ensureInitialized();
    try {
      const categories = await this.makeRequest('get_series_categories');
      if (!Array.isArray(categories)) {
        console.warn('Show categories response is not an array:', categories);
        return [];
      }
      const formattedCategories = categories.map((cat: any) => ({
        id: cat.category_id,
        name: cat.category_name,
        parentId: cat.parent_id
      }));

      await this.ensureDBInitialized();
      if (this.currentProfile) {
        await indexedDBService.saveCategories(
          'show',
          formattedCategories,
          this.currentProfile.id
        );
      }
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
      if (this.currentProfile) {
        await indexedDBService.saveChannels(
          formattedChannels,
          this.currentProfile.id
        );
      }
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
      if (this.currentProfile) {
        await indexedDBService.saveMovies(
          formattedMovies,
          this.currentProfile.id
        );
      }
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
      await this.ensureDBInitialized();
      const cached = await indexedDBService.getMovie(movieId);
      if (cached && 'plot' in cached) {
        return cached as MovieDetails;
      }
    }

    this.ensureInitialized();
    try {
      const movie = await this.makeRequest('get_vod_info', { vod_id: movieId });
      const movieDetails: MovieDetails = {
        id: movie.info?.id || movie.info?.stream_id || movieId,
        name: movie.info?.name || '',
        streamType:
          movie.info?.streamType || movie.info?.stream_type || 'movie',
        streamIcon: movie.info?.streamIcon || movie.info?.stream_icon,
        rating: movie.info?.rating,
        year: movie.info?.year,
        added: movie.info?.added,
        categoryId: movie.info?.categoryId || movie.info?.category_id,
        containerExtension:
          movie.info?.containerExtension || movie.info?.container_extension,
        customSid: movie.info?.customSid || movie.info?.custom_sid,
        directSource: movie.info?.directSource || movie.info?.direct_source,
        plot: movie.info?.plot,
        cast: movie.info?.cast,
        director: movie.info?.director,
        genre: movie.info?.genre,
        releaseDate: movie.info?.releaseDate || movie.info?.release_date,
        lastModified: movie.info?.lastModified || movie.info?.last_modified,
        rating5based: movie.info?.rating5based || movie.info?.rating_5based,
        backdropPath: movie.info?.backdropPath || movie.info?.backdrop_path,
        youtubeTrailer:
          movie.info?.youtubeTrailer || movie.info?.youtube_trailer,
        tmdbId: movie.info?.tmdbId || movie.info?.tmdb_id,
        imdbId: movie.info?.imdbId || movie.info?.imdb_id
      };

      // Update the movie in IndexedDB with full details
      await this.ensureDBInitialized();
      if (this.currentProfile) {
        await indexedDBService.saveMovies(
          [movieDetails],
          this.currentProfile.id
        );
      }

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
      await this.ensureDBInitialized();
      const cached = await indexedDBService.getShows(options?.categoryId);
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

      const shows = await this.makeRequest('get_series', params);
      if (!Array.isArray(shows)) {
        console.warn('Shows response is not an array:', shows);
        return [];
      }
      const formattedShows = shows.map((show: any) => ({
        id: show.series_id,
        name: show.name,
        streamType: show.stream_type,
        streamIcon: show.stream_icon,
        rating: show.rating,
        year: show.year,
        added: show.added,
        categoryId: show.category_id,
        lastModified: show.last_modified
      }));

      await this.ensureDBInitialized();
      if (this.currentProfile) {
        await indexedDBService.saveShows(
          formattedShows,
          this.currentProfile.id
        );
      }
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
      await this.ensureDBInitialized();
      const cached = await indexedDBService.getShow(showId);
      if (cached && 'episodes' in cached) {
        return cached as ShowDetails;
      }
    }

    this.ensureInitialized();
    try {
      const show = await this.makeRequest('get_series_info', {
        series_id: showId
      });
      const showDetails: ShowDetails = {
        id: show.info?.id || show.info?.series_id || showId,
        name: show.info?.name || '',
        streamType: show.info?.streamType || show.info?.stream_type || 'series',
        streamIcon: show.info?.streamIcon || show.info?.stream_icon,
        rating: show.info?.rating,
        year: show.info?.year,
        added: show.info?.added,
        categoryId: show.info?.categoryId || show.info?.category_id,
        lastModified: show.info?.lastModified || show.info?.last_modified,
        plot: show.info?.plot,
        cast: show.info?.cast,
        director: show.info?.director,
        genre: show.info?.genre,
        releaseDate: show.info?.releaseDate || show.info?.release_date,
        rating5based: show.info?.rating5based || show.info?.rating_5based,
        backdropPath: show.info?.backdropPath || show.info?.backdrop_path,
        youtubeTrailer: show.info?.youtubeTrailer || show.info?.youtube_trailer,
        tmdbId: show.info?.tmdbId || show.info?.tmdb_id,
        imdbId: show.info?.imdbId || show.info?.imdb_id,
        episodes: show.episodes || []
      };

      // Update the show in IndexedDB with full details
      await this.ensureDBInitialized();
      if (this.currentProfile) {
        await indexedDBService.saveShows([showDetails], this.currentProfile.id);
      }

      // Save episodes if available
      if (
        showDetails.episodes &&
        showDetails.episodes.length > 0 &&
        this.currentProfile
      ) {
        await indexedDBService.saveEpisodes(
          showId,
          showDetails.episodes,
          this.currentProfile.id
        );
      }

      return showDetails;
    } catch (error) {
      console.error('Failed to get show details:', error);
      throw new Error('Failed to get show details');
    }
  }

  async getEpisodes(showId: string, forceRefresh = false): Promise<Episode[]> {
    if (!forceRefresh) {
      const cached = await indexedDBService.getEpisodes(
        showId,
        this.currentProfile?.id
      );
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
      const params: Record<string, string> = { stream_id: channelId };
      if (limit) {
        params.limit = limit.toString();
      }
      const epg = await this.makeRequest('get_short_epg', params);
      if (!Array.isArray(epg)) {
        console.warn('Short EPG response is not an array:', epg);
        return [];
      }
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
      const epg = await this.makeRequest('get_epg', { stream_id: channelId });
      if (!Array.isArray(epg)) {
        console.warn('Full EPG response is not an array:', epg);
        return [];
      }
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
