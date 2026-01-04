import { useEffect, useState } from 'react';
import { call } from '@decky/api';
import { DEFAULT_SETTINGS } from '../constants';
import { PluginSettings } from '../../types/types';

let cachedSettings: PluginSettings = { ...DEFAULT_SETTINGS };
let settingsListeners: Set<(settings: PluginSettings) => void> = new Set();

export function loadSettings(): Promise<PluginSettings> {
  console.log('[SteamStatus] loadSettings: Loading from Python backend...');
  console.log('[SteamStatus] loadSettings: DEFAULT_SETTINGS =', DEFAULT_SETTINGS);
  return call<[], PluginSettings>('get_settings').then((settings) => {
    console.log('[SteamStatus] loadSettings: Python returned =', settings);
    // Filter out empty string values from Python settings so they don't override frontend defaults
    const filteredSettings: Partial<PluginSettings> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value !== '' && value !== null && value !== undefined) {
        filteredSettings[key as keyof PluginSettings] = value;
      }
    }
    console.log('[SteamStatus] loadSettings: Filtered settings =', filteredSettings);
    cachedSettings = { ...DEFAULT_SETTINGS, ...filteredSettings };
    console.log('[SteamStatus] loadSettings: Final cachedSettings =', cachedSettings);
    notifyListeners();
    return cachedSettings;
  }).catch((e) => {
    console.error('[SteamStatus] loadSettings: Failed to load settings:', e);
    return cachedSettings;
  });
}

function notifyListeners() {
  settingsListeners.forEach((listener) => listener(cachedSettings));
}

export function useSettings(): [PluginSettings, (key: keyof PluginSettings, value: any) => Promise<void>] {
  const [settings, setSettings] = useState<PluginSettings>(cachedSettings);

  useEffect(() => {
    const listener = (newSettings: PluginSettings) => {
      setSettings({ ...newSettings });
    };
    settingsListeners.add(listener);

    // Load settings on mount
    loadSettings();

    return () => {
      settingsListeners.delete(listener);
    };
  }, []);

  const updateSetting = async (key: keyof PluginSettings, value: any) => {
    cachedSettings = { ...cachedSettings, [key]: value };
    setSettings(cachedSettings);
    notifyListeners();

    await call<[string, any], boolean>('set_setting', key, value);
  };

  return [settings, updateSetting];
}

export function getSettings(): PluginSettings {
  return cachedSettings;
}
