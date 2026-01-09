import { useState, useEffect } from 'react';
import { SteamStatus, OutageEntry } from '../../types/types';

export interface OutageInfo {
  hasCurrentOutage: boolean;
  hadRecentOutage: boolean;
  outageCount: number;
  lastOutageTime: string | null;
}

// This hook only provides outage info for UI display
// Notifications are handled by the background monitor service
export function useOutageDetection(status: SteamStatus | null): OutageInfo {
  const [outageInfo, setOutageInfo] = useState<OutageInfo>({
    hasCurrentOutage: false,
    hadRecentOutage: false,
    outageCount: 0,
    lastOutageTime: null,
  });

  useEffect(() => {
    if (!status) return;

    // Check current service status for outage
    const currentServicesDown = Object.values(status.services).some(
      (svc) => svc.status !== 'online'
    );

    // Check recent_outages for outages in the last hour (from outage log)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentOutages = status.recent_outages?.filter((entry: OutageEntry) => {
      // Only count outage and degraded events, not recoveries
      if (entry.type === 'recovered') return false;
      // Only count main services, not CM regions
      if (entry.is_cm) return false;
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime >= oneHourAgo;
    }) || [];
    const hadRecentOutage = recentOutages.length > 0;
    // recent_outages is sorted newest first, so first element is most recent
    const lastOutage = recentOutages.length > 0 ? recentOutages[0] : null;

    setOutageInfo({
      hasCurrentOutage: currentServicesDown,
      hadRecentOutage,
      outageCount: recentOutages.length,
      lastOutageTime: lastOutage?.timestamp || null,
    });
  }, [status]);

  return outageInfo;
}
