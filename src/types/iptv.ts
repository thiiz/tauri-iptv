export interface XtreamConfig {
  url: string;
  username: string;
  password: string;
  preferredFormat?: string;
}

export interface ProfileAccount {
  id: string;
  name: string;
  config: XtreamConfig;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  userProfile?: UserProfile;
  serverInfo?: ServerInfo;
}

export interface UserProfile {
  id: string;
  username: string;
  password: string;
  email: string;
  expDate: string;
  isActive: boolean;
  createdAt: string;
  maxConnections: number;
  allowedOutputFormats: string[];
}

export interface ServerInfo {
  url: string;
  port: string;
  httpsPort: string;
  serverProtocol: string;
  rtmpPort: string;
  timezone: string;
  timestampNow: number;
  timeNow: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface Channel {
  id: string;
  name: string;
  streamType: string;
  streamIcon?: string;
  epgChannelId?: string;
  added: string;
  categoryId: string;
  customSid?: string;
  tvArchive: number;
  directSource?: string;
  tvArchiveDuration?: number;
}

export interface Movie {
  id: string;
  name: string;
  streamType: string;
  streamIcon?: string;
  rating?: number;
  year?: number;
  added: string;
  categoryId: string;
  containerExtension: string;
  customSid?: string;
  directSource?: string;
}

export interface MovieDetails extends Movie {
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  lastModified?: string;
  rating5based?: number;
  backdropPath?: string[];
  youtubeTrailer?: string;
  tmdbId?: number;
  imdbId?: string;
}

export interface Show {
  id: string;
  name: string;
  streamType: string;
  streamIcon?: string;
  rating?: number;
  year?: number;
  added: string;
  categoryId: string;
  lastModified?: string;
}

export interface ShowDetails extends Show {
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  rating5based?: number;
  backdropPath?: string[];
  youtubeTrailer?: string;
  tmdbId?: number;
  imdbId?: string;
  episodes?: { [season: number]: Episode[] };
}

export interface Episode {
  id: string;
  episodeNum: number;
  title: string;
  containerExtension: string;
  info: {
    movieImage?: string;
    plot?: string;
    cast?: string;
    director?: string;
    genre?: string;
    releaseDate?: string;
    rating?: number;
    tmdbId?: number;
    season?: number;
  };
  customSid?: string;
  added: string;
  season: number;
}

export interface EPGProgram {
  id: string;
  title: string;
  description?: string;
  start: string;
  stop: string;
  channelId: string;
}

export interface StreamOptions {
  type: 'channel' | 'movie' | 'episode';
  streamId: string | number;
  extension: string;
  timeshift?: {
    duration: number;
    start: Date;
  };
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoplay: boolean;
  defaultQuality: string;
  alwaysOnTop: boolean;
  minimizeToTray: boolean;
  startWithSystem: boolean;
  enableNotifications: boolean;
  cacheSize: number;
}

export interface FavoriteItem {
  id: string;
  type: 'channel' | 'movie' | 'show';
  name: string;
  streamIcon?: string;
  addedAt: string;
  profileId?: string;
}

export interface WatchHistory {
  id: string;
  type: 'channel' | 'movie' | 'episode';
  name: string;
  streamIcon?: string;
  watchedAt: string;
  duration?: number;
  position?: number;
  profileId?: string;
}
