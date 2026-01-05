export interface ServiceStatus {
  status: 'online' | 'degraded' | 'offline';
  response_time_ms: number;
}

export interface SteamServices {
  store: ServiceStatus;
  community: ServiceStatus;
  webapi: ServiceStatus;
  cms?: ServiceStatus;
}

export interface HistoryEntry {
  timestamp: string;
  online: number;
  all_services_up: boolean;
}

export interface TrendingGame {
  appid: number;
  name: string;
  current_players: number;
  gain_48h: number;
  gain_percent: number;
}

export interface CMRegion {
  region: string;
  country: string;
  flag: string;
  status: 'online' | 'degraded' | 'offline';
  response_time_ms: number;
  server_count: number;
}

export interface CacheInfo {
  last_fetch: string;
  age_seconds: number;
  next_refresh_seconds: number;
}

export interface SteamStatus {
  online: number;
  services: SteamServices;
  cm_regions?: CMRegion[];
  history: HistoryEntry[];
  trending_games?: TrendingGame[];
  cache: CacheInfo;
  timestamp: string;
}

export interface PluginSettings {
  gateway_url: string;
  gateway_api_key: string;
  refresh_interval_seconds: number;
  show_history: boolean;
  enable_notifications: boolean;
  show_trending_games: boolean;
  check_for_updates: boolean;
}

export interface CachedStatus {
  data: SteamStatus;
  cachedAt: number;
}
