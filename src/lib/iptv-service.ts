import type {
  Category,
  Channel,
  EPGProgram,
  Movie,
  MovieDetails,
  ServerInfo,
  Show,
  ShowDetails,
  StreamOptions,
  UserProfile,
  XtreamConfig,
} from '@/types/iptv';
import { Xtream } from '@iptv/xtream-api';
import { standardizedSerializer } from '@iptv/xtream-api/standardized';

export class IPTVService {
  private xtream: Xtream | null = null;
  private config: XtreamConfig | null = null;

  constructor() { }

  async initialize(config: XtreamConfig): Promise<void> {
    this.config = config;
    this.xtream = new Xtream({
      url: config.url,
      username: config.username,
      password: config.password,
      preferredFormat: config.preferredFormat || 'm3u8',
      serializer: standardizedSerializer,
    });
  }

  private ensureInitialized(): void {
    if (!this.xtream || !this.config) {
      throw new Error('IPTV service not initialized. Call initialize() first.');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      await this.xtream!.getProfile();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    this.ensureInitialized();
    try {
      const profile = await this.xtream!.getProfile();
      return {
        id: profile.id || '',
        username: profile.username || '',
        password: profile.password || '',
        email: profile.email || '',
        expDate: profile.expDate || '',
        isActive: profile.isActive || false,
        createdAt: profile.createdAt || '',
        maxConnections: profile.maxConnections || 1,
        allowedOutputFormats: profile.allowedOutputFormats || [],
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  async getServerInfo(): Promise<ServerInfo> {
    this.ensureInitialized();
    try {
      const info = await this.xtream!.getServerInfo();
      return {
        url: info.url || '',
        port: info.port || '',
        httpsPort: info.httpsPort || '',
        serverProtocol: info.serverProtocol || '',
        rtmpPort: info.rtmpPort || '',
        timezone: info.timezone || '',
        timestampNow: info.timestampNow || Date.now(),
        timeNow: info.timeNow || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get server info:', error);
      throw new Error('Failed to get server info');
    }
  }

  async getChannelCategories(): Promise<Category[]> {
    this.ensureInitialized();
    try {
      const categories = await this.xtream!.getChannelCategories();
      return categories.map((cat: any) => ({
        id: cat.id || cat.category_id,
        name: cat.name || cat.category_name,
        parentId: cat.parentId || cat.parent_id,
      }));
    } catch (error) {
      console.error('Failed to get channel categories:', error);
      throw new Error('Failed to get channel categories');
    }
  }

  async getMovieCategories(): Promise<Category[]> {
    this.ensureInitialized();
    try {
      const categories = await this.xtream!.getMovieCategories();
      return categories.map((cat: any) => ({
        id: cat.id || cat.category_id,
        name: cat.name || cat.category_name,
        parentId: cat.parentId || cat.parent_id,
      }));
    } catch (error) {
      console.error('Failed to get movie categories:', error);
      throw new Error('Failed to get movie categories');
    }
  }

  async getShowCategories(): Promise<Category[]> {
    this.ensureInitialized();
    try {
      const categories = await this.xtream!.getShowCategories();
      return categories.map((cat: any) => ({
        id: cat.id || cat.category_id,
        name: cat.name || cat.category_name,
        parentId: cat.parentId || cat.parent_id,
      }));
    } catch (error) {
      console.error('Failed to get show categories:', error);
      throw new Error('Failed to get show categories');
    }
  }

  async getChannels(options?: { categoryId?: string; page?: number; limit?: number }): Promise<Channel[]> {
    this.ensureInitialized();
    try {
      const channels = await this.xtream!.getChannels(options);
      return channels.map((ch: any) => ({
        id: ch.id || ch.stream_id,
        name: ch.name,
        streamType: ch.streamType || ch.stream_type,
        streamIcon: ch.streamIcon || ch.stream_icon,
        epgChannelId: ch.epgChannelId || ch.epg_channel_id,
        added: ch.added,
        categoryId: ch.categoryId || ch.category_id,
        customSid: ch.customSid || ch.custom_sid,
        tvArchive: ch.tvArchive || ch.tv_archive || 0,
        directSource: ch.directSource || ch.direct_source,
        tvArchiveDuration: ch.tvArchiveDuration || ch.tv_archive_duration,
      }));
    } catch (error) {
      console.error('Failed to get channels:', error);
      throw new Error('Failed to get channels');
    }
  }

  async getMovies(options?: { categoryId?: string; page?: number; limit?: number }): Promise<Movie[]> {
    this.ensureInitialized();
    try {
      const movies = await this.xtream!.getMovies(options);
      return movies.map((movie: any) => ({
        id: movie.id || movie.stream_id,
        name: movie.name,
        streamType: movie.streamType || movie.stream_type,
        streamIcon: movie.streamIcon || movie.stream_icon,
        rating: movie.rating,
        year: movie.year,
        added: movie.added,
        categoryId: movie.categoryId || movie.category_id,
        containerExtension: movie.containerExtension || movie.container_extension,
        customSid: movie.customSid || movie.custom_sid,
        directSource: movie.directSource || movie.direct_source,
      }));
    } catch (error) {
      console.error('Failed to get movies:', error);
      throw new Error('Failed to get movies');
    }
  }

  async getMovieDetails(movieId: string): Promise<MovieDetails> {
    this.ensureInitialized();
    try {
      const movie = await this.xtream!.getMovie({ movieId });
      return {
        id: movie.id || movie.stream_id,
        name: movie.name,
        streamType: movie.streamType || movie.stream_type,
        streamIcon: movie.streamIcon || movie.stream_icon,
        rating: movie.rating,
        year: movie.year,
        added: movie.added,
        categoryId: movie.categoryId || movie.category_id,
        containerExtension: movie.containerExtension || movie.container_extension,
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
        imdbId: movie.imdbId || movie.imdb_id,
      };
    } catch (error) {
      console.error('Failed to get movie details:', error);
      throw new Error('Failed to get movie details');
    }
  }

  async getShows(options?: { categoryId?: string; page?: number; limit?: number }): Promise<Show[]> {
    this.ensureInitialized();
    try {
      const shows = await this.xtream!.getShows(options);
      return shows.map((show: any) => ({
        id: show.id || show.series_id,
        name: show.name,
        streamType: show.streamType || show.stream_type,
        streamIcon: show.streamIcon || show.stream_icon,
        rating: show.rating,
        year: show.year,
        added: show.added,
        categoryId: show.categoryId || show.category_id,
        lastModified: show.lastModified || show.last_modified,
      }));
    } catch (error) {
      console.error('Failed to get shows:', error);
      throw new Error('Failed to get shows');
    }
  }

  async getShowDetails(showId: string): Promise<ShowDetails> {
    this.ensureInitialized();
    try {
      const show = await this.xtream!.getShow({ showId });
      return {
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
        episodes: show.episodes || [],
      };
    } catch (error) {
      console.error('Failed to get show details:', error);
      throw new Error('Failed to get show details');
    }
  }

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
        channelId: program.channelId || channelId,
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
        channelId: program.channelId || channelId,
      }));
    } catch (error) {
      console.error('Failed to get full EPG:', error);
      throw new Error('Failed to get EPG data');
    }
  }

  generateStreamUrl(options: StreamOptions): string {
    this.ensureInitialized();
    try {
      return this.xtream!.generateStreamUrl(options);
    } catch (error) {
      console.error('Failed to generate stream URL:', error);
      throw new Error('Failed to generate stream URL');
    }
  }

  getConfig(): XtreamConfig | null {
    return this.config;
  }
}

// Singleton instance
export const iptvService = new IPTVService();