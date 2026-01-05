export const PLUGIN_VERSION = '1.0.0';

export const STATUS_PAGE_URL = 'https://steamstatus.schelstraete.org/status';

export const DEFAULT_SETTINGS = {
  gateway_url: 'https://steamstatus.schelstraete.org',
  gateway_api_key: 'A7f9K2mQ8R3D6T1ZJ5W0H4CNYVXEP9',
  refresh_interval_seconds: 300,
  show_history: true,
  enable_notifications: true,
  show_trending_games: true,
  check_for_updates: true,
};

export const STATUS_COLORS = {
  online: '#4caf50',
  degraded: '#ff9800',
  offline: '#f44336',
  unknown: '#9e9e9e',
};

export const CACHE_KEY = 'steamstat_last_status';
