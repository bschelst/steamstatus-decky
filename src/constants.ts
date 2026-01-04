export const PLUGIN_VERSION = '1.0.0';

export const DEFAULT_SETTINGS = {
  gateway_url: 'https://bschelst-thinkpad-p70.grolar-tiyanki.ts.net:18888',
  gateway_api_key: 'bart',
  status_page_url: 'https://store.steampowered.com/charts',
  refresh_interval_seconds: 180,
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
