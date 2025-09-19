import type {
  Category,
  Channel,
  EPGProgram,
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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class TauriIPTVService {
  private config: XtreamConfig | null = null;
  private currentProfile: ProfileAccount | null = null;

  constructor() {}

  async initialize(config: XtreamConfig): Promise<void> {
    this.config = config;
  }

  async initializeWithProfile(profile: ProfileAccount): Promise<void> {
    this.currentProfile = profile;
    this.config = profile.config;
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

  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();

      const response = await invoke<ApiResponse<any>>('test_iptv_connection', {
        config: {
          url: this.config!.url,
          username: this.config!.username,
          password: this.config!.password,
          preferred_format: this.config!.preferredFormat
        }
      });

      return response.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      const profile = await this.makeRequest('get_profile');
      return {
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
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  async getServerInfo(): Promise<ServerInfo> {
    try {
      const info = await this.makeRequest('get_profile');
      const serverInfo = info.server_info || {};
      return {
        url: serverInfo.url || '',
        port: serverInfo.port || '',
        httpsPort: serverInfo.https_port || '',
        serverProtocol: serverInfo.server_protocol || '',
        rtmpPort: serverInfo.rtmp_port || '',
        timezone: serverInfo.timezone || '',
        timestampNow: serverInfo.timestamp_now || Date.now(),
        timeNow: serverInfo.time_now || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get server info:', error);
      throw new Error('Failed to get server info');
    }
  }

  async getChannelCategories(): Promise<Category[]> {
    try {
      const categories = await this.makeRequest('get_live_categories');
      if (!Array.isArray(categories)) {
        console.warn('Categories response is not an array:', categories);
        return [];
      }
      return categories.map((cat: any) => ({
        id: cat.category_id,
        name: cat.category_name,
        parentId: cat.parent_id
      }));
    } catch (error) {
      console.error('Failed to get channel categories:', error);
      throw new Error('Failed to get channel categories');
    }
  }

  async getMovieCategories(): Promise<Category[]> {
    try {
      const categories = await this.makeRequest('get_vod_categories');
      if (!Array.isArray(categories)) {
        console.warn('Categories response is not an array:', categories);
        return [];
      }
      return categories.map((cat: any) => ({
        id: cat.category_id,
        name: cat.category_name,
        parentId: cat.parent_id
      }));
    } catch (error) {
      console.error('Failed to get movie categories:', error);
      throw new Error('Failed to get movie categories');
    }
  }

  async getShowCategories(): Promise<Category[]> {
    try {
      const categories = await this.makeRequest('get_series_categories');
      if (!Array.isArray(categories)) {
        console.warn('Categories response is not an array:', categories);
        return [];
      }
      return categories.map((cat: any) => ({
        id: cat.category_id,
        name: cat.category_name,
        parentId: cat.parent_id
      }));
    } catch (error) {
      console.error('Failed to get show categories:', error);
      throw new Error('Failed to get show categories');
    }
  }

  async getChannels(options?: {
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Promise<Channel[]> {
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
      return channels.map((ch: any) => ({
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
    } catch (error) {
      console.error('Failed to get channels:', error);
      throw new Error('Failed to get channels');
    }
  }

  async getMovies(options?: {
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Promise<Movie[]> {
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
      return movies.map((movie: any) => ({
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
    } catch (error) {
      console.error('Failed to get movies:', error);
      throw new Error('Failed to get movies');
    }
  }

  async getMovieDetails(movieId: string): Promise<MovieDetails> {
    try {
      const movie = await this.makeRequest('get_vod_info', { vod_id: movieId });
      const info = movie.info || {};
      const movieInfo = movie.movie_data || {};

      return {
        id: movieInfo.stream_id || movieId,
        name: movieInfo.name || '',
        streamType: movieInfo.stream_type || '',
        streamIcon: movieInfo.stream_icon || '',
        rating: movieInfo.rating || '',
        year: movieInfo.year || '',
        added: movieInfo.added || '',
        categoryId: movieInfo.category_id || '',
        containerExtension: movieInfo.container_extension || '',
        customSid: movieInfo.custom_sid || '',
        directSource: movieInfo.direct_source || '',
        plot: info.plot || '',
        cast: info.cast || '',
        director: info.director || '',
        genre: info.genre || '',
        releaseDate: info.releasedate || '',
        lastModified: info.last_modified || '',
        rating5based: info.rating_5based || 0,
        backdropPath: info.backdrop_path || '',
        youtubeTrailer: info.youtube_trailer || '',
        tmdbId: info.tmdb_id || '',
        imdbId: info.imdb_id || ''
      };
    } catch (error) {
      console.error('Failed to get movie details:', error);
      throw new Error('Failed to get movie details');
    }
  }

  async getShows(options?: {
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Promise<Show[]> {
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
      return shows.map((show: any) => ({
        id: show.series_id,
        name: show.name,
        streamType: show.stream_type || 'series',
        streamIcon: show.cover,
        rating: show.rating,
        year: show.year,
        added: show.last_modified,
        categoryId: show.category_id,
        lastModified: show.last_modified
      }));
    } catch (error) {
      console.error('Failed to get shows:', error);
      throw new Error('Failed to get shows');
    }
  }

  async getShowDetails(showId: string): Promise<ShowDetails> {
    try {
      const show = await this.makeRequest('get_series_info', {
        series_id: showId
      });
      const info = show.info || {};
      const episodes = show.episodes || {};

      return {
        id: showId,
        name: info.name || '',
        streamType: 'series',
        streamIcon: info.cover || '',
        rating: info.rating || '',
        year: info.year || '',
        added: info.last_modified || '',
        categoryId: info.category_id || '',
        lastModified: info.last_modified || '',
        plot: info.plot || '',
        cast: info.cast || '',
        director: info.director || '',
        genre: info.genre || '',
        releaseDate: info.releaseDate || '',
        rating5based: info.rating_5based || 0,
        backdropPath: info.backdrop_path || '',
        youtubeTrailer: info.youtube_trailer || '',
        tmdbId: info.tmdb_id || '',
        imdbId: info.imdb_id || '',
        episodes:
          Object.values(episodes)
            .flat()
            .map((ep: any) => ({
              id: ep.id || '',
              episodeNum: ep.episode_num || 0,
              title: ep.title || '',
              containerExtension: ep.container_extension || '',
              info: {
                movieImage: ep.info?.movie_image || '',
                plot: ep.info?.plot || '',
                cast: ep.info?.cast || '',
                director: ep.info?.director || '',
                genre: ep.info?.genre || '',
                releaseDate: ep.info?.releasedate || '',
                rating: ep.info?.rating || 0,
                tmdbId: ep.info?.tmdb_id || 0,
                season: ep.info?.season || 0
              },
              customSid: ep.custom_sid || '',
              added: ep.added || '',
              season: ep.season || 0
            })) || []
      };
    } catch (error) {
      console.error('Failed to get show details:', error);
      throw new Error('Failed to get show details');
    }
  }

  async getShortEPG(channelId: string, limit?: number): Promise<EPGProgram[]> {
    try {
      const params: Record<string, string> = { stream_id: channelId };
      if (limit) {
        params.limit = limit.toString();
      }

      const epg = await this.makeRequest('get_short_epg', params);
      return Object.values(epg.epg_listings || {})
        .flat()
        .map((program: any) => ({
          id: program.id,
          title: program.title,
          description: program.description,
          start: program.start,
          stop: program.stop,
          channelId: channelId
        }));
    } catch (error) {
      console.error('Failed to get short EPG:', error);
      throw new Error('Failed to get EPG data');
    }
  }

  async getFullEPG(channelId: string): Promise<EPGProgram[]> {
    try {
      const epg = await this.makeRequest('get_simple_data_table', {
        stream_id: channelId
      });
      return Object.values(epg.epg_listings || {})
        .flat()
        .map((program: any) => ({
          id: program.id,
          title: program.title,
          description: program.description,
          start: program.start,
          stop: program.stop,
          channelId: channelId
        }));
    } catch (error) {
      console.error('Failed to get full EPG:', error);
      throw new Error('Failed to get EPG data');
    }
  }

  generateStreamUrl(options: StreamOptions): string {
    this.ensureInitialized();

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
  }

  getConfig(): XtreamConfig | null {
    return this.config;
  }

  getCurrentProfile(): ProfileAccount | null {
    return this.currentProfile;
  }
}

// Singleton instance
export const tauriIPTVService = new TauriIPTVService();
