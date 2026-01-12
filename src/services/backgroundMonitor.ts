import { toaster } from '@decky/api';
import { Navigation } from '@decky/ui';
import { FaSteam, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import React from 'react';
import { SteamStatus } from '../../types/types';
import { DEFAULT_SETTINGS } from '../constants';

// Create notification logo with Steam icon and corner badge
// Note: Steam notification system uses dynamic sizing - we use 1em units to scale with system font
// Typical notification logo container is ~40-48px, so 1em = base size, relative units scale appropriately
function createNotificationLogo(badgeIcon: typeof FaExclamationTriangle | typeof FaCheckCircle, badgeColor: string) {
  return React.createElement('div', {
    style: {
      position: 'relative',
      width: '1em',
      height: '1em',
      fontSize: '36px', // Base size - Steam will scale this
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }, [
    // Steam logo (main icon)
    React.createElement(FaSteam, {
      key: 'steam',
      style: {
        color: '#66c0f4',
        fontSize: '1em',
        width: '1em',
        height: '1em',
      }
    }),
    // Badge in corner
    React.createElement('div', {
      key: 'badge',
      style: {
        position: 'absolute',
        bottom: '-0.05em',
        right: '-0.05em',
        width: '0.5em',
        height: '0.5em',
        backgroundColor: '#1b2838',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '0.05em solid #1b2838',
      }
    }, React.createElement(badgeIcon, {
      style: {
        fontSize: '0.33em',
        color: badgeColor,
      }
    }))
  ]);
}

// Module-level state for background monitoring
let monitorInterval: ReturnType<typeof setInterval> | null = null;
let lastKnownOutageState = false;
let notificationSentForOutage = false;

// Anti-flood mechanism: Track notification timestamps
const notificationHistory: number[] = [];
const ANTIFLOOD_MAX_NOTIFICATIONS = 10;
const ANTIFLOOD_TIME_WINDOW = 3 * 60 * 1000; // 3 minutes in milliseconds

// Shared state that UI components can read
export let lastFetchedStatus: SteamStatus | null = null;
export let lastFetchTime: number | null = null;
export let lastFetchError: string | null = null;

/**
 * Check if we should rate-limit notifications to prevent spam
 * @param enableAntiflood - Whether anti-flood protection is enabled
 * @returns true if notification should be blocked, false if it can be sent
 */
function shouldRateLimitNotification(enableAntiflood: boolean): boolean {
  if (!enableAntiflood) {
    return false; // Anti-flood disabled, don't rate limit
  }

  const now = Date.now();

  // Remove old timestamps outside the time window
  while (notificationHistory.length > 0 && notificationHistory[0] < now - ANTIFLOOD_TIME_WINDOW) {
    notificationHistory.shift();
  }

  // Check if we've hit the limit
  if (notificationHistory.length >= ANTIFLOOD_MAX_NOTIFICATIONS) {
    console.log('[SteamStatus] Anti-flood: Notification rate limit reached. Blocking notification.');
    return true; // Block notification
  }

  return false; // Allow notification
}

/**
 * Record that a notification was sent (for anti-flood tracking)
 */
function recordNotification(): void {
  notificationHistory.push(Date.now());
}

async function fetchStatus(): Promise<SteamStatus | null> {
  // Load settings from localStorage
  const settingsStr = localStorage.getItem('steamstat_settings');
  const settings = settingsStr ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsStr) } : DEFAULT_SETTINGS;

  if (!settings.gateway_url || !settings.gateway_api_key) {
    lastFetchError = 'Gateway not configured';
    return null;
  }

  try {
    const response = await fetch(`${settings.gateway_url}/api/v1/status`, {
      method: 'GET',
      headers: {
        'X-API-Key': settings.gateway_api_key,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data: SteamStatus = await response.json();
    lastFetchedStatus = data;
    lastFetchTime = Date.now();
    lastFetchError = null;
    return data;
  } catch (e) {
    lastFetchError = e instanceof Error ? e.message : 'Failed to fetch status';
    console.error('Background monitor: Failed to fetch Steam status:', lastFetchError);
    return null;
  }
}

function checkForOutageAndNotify(status: SteamStatus, enableNotifications: boolean, enableAntiflood: boolean): void {
  const currentServicesDown = Object.values(status.services).some(
    (svc) => svc.status !== 'online'
  );

  // Detect state transitions
  const outageJustStarted = currentServicesDown && !lastKnownOutageState;
  const outageJustEnded = !currentServicesDown && lastKnownOutageState;

  // Send notification for new outage
  if (outageJustStarted && !notificationSentForOutage && enableNotifications) {
    // Check anti-flood rate limit
    if (shouldRateLimitNotification(enableAntiflood)) {
      console.log('[SteamStatus] Outage notification blocked by anti-flood protection');
    } else {
      notificationSentForOutage = true;

      const affectedServices = Object.entries(status.services)
        .filter(([, svc]) => svc.status !== 'online')
        .map(([name]) => name)
        .join(', ');

      toaster.toast({
        title: 'Steam Service Outage',
        body: `Services affected: ${affectedServices}`,
        logo: createNotificationLogo(FaExclamationTriangle, '#ff9800'),
        onClick: () => Navigation.NavigateToExternalWeb('https://steamstatus.schelstraete.org/status'),
        duration: 8000,
        critical: true,
        playSound: true,
        showToast: true,
      });

      recordNotification();
    }
  }

  // Send recovery notification
  if (outageJustEnded && enableNotifications) {
    // Check anti-flood rate limit
    if (shouldRateLimitNotification(enableAntiflood)) {
      console.log('[SteamStatus] Recovery notification blocked by anti-flood protection');
    } else {
      notificationSentForOutage = false;

      toaster.toast({
        title: 'Steam Services Restored',
        body: 'All Steam services are now online',
        logo: createNotificationLogo(FaCheckCircle, '#4caf50'),
        onClick: () => Navigation.NavigateToExternalWeb('https://steamstatus.schelstraete.org/status'),
        duration: 5000,
        playSound: true,
        showToast: true,
      });

      recordNotification();
    }
  }

  // Update last known state
  lastKnownOutageState = currentServicesDown;
}

async function monitorTick(): Promise<void> {
  const settingsStr = localStorage.getItem('steamstat_settings');
  const settings = settingsStr ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsStr) } : DEFAULT_SETTINGS;

  const status = await fetchStatus();
  if (status) {
    checkForOutageAndNotify(status, settings.enable_notifications, settings.enable_notification_antiflood);
  }
}

export function startBackgroundMonitor(): void {
  if (monitorInterval) {
    return; // Already running
  }

  console.log('Steam Status: Starting background monitor');

  // Initial fetch
  monitorTick();

  // Set up interval - check every 60 seconds for background monitoring
  // This is separate from the UI refresh interval
  const BACKGROUND_CHECK_INTERVAL = 60 * 1000; // 60 seconds
  monitorInterval = setInterval(monitorTick, BACKGROUND_CHECK_INTERVAL);
}

export function stopBackgroundMonitor(): void {
  if (monitorInterval) {
    console.log('Steam Status: Stopping background monitor');
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

// Export for UI components to check current outage state without re-notifying
export function getCurrentOutageState(): boolean {
  return lastKnownOutageState;
}

export function getNotificationSentState(): boolean {
  return notificationSentForOutage;
}
