import React, { useState, useEffect } from 'react';
import { PanelSection, PanelSectionRow, ButtonItem, Focusable, Navigation } from '@decky/ui';
import { FaCircle, FaSync, FaExternalLinkAlt } from 'react-icons/fa';
import { SteamStatus } from '../../types/types';
import { formatRelativeTime, getStatusColor } from '../utils/formatters';
import { TrendingGamesPanel } from './TrendingGames';
import { ConnectionManagersPanel } from './ConnectionManagersPanel';
import { useSettings } from '../hooks/useSettings';
import useTranslations from '../hooks/useTranslations';
import { STATUS_PAGE_URL } from '../constants';

interface StatusPanelProps {
  status: SteamStatus | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  lastUpdated: number | null;
  onRefresh: () => void;
  noWrapper?: boolean;
}

const REFRESH_COOLDOWN_SECONDS = 30;

export const StatusPanel: React.FC<StatusPanelProps> = ({
  status,
  isLoading,
  error,
  isOffline,
  lastUpdated,
  onRefresh,
  noWrapper = false,
}) => {
  const t = useTranslations();
  const [settings] = useSettings();
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [refreshFocused, setRefreshFocused] = useState(false);
  const [statusFocused, setStatusFocused] = useState(false);

  // Update the "Updated Xs ago" counter every second
  useEffect(() => {
    const updateTime = () => {
      if (lastUpdated) {
        setTimeSinceUpdate(Math.floor((Date.now() - lastUpdated) / 1000));
      } else if (status?.cache?.age_seconds !== undefined) {
        setTimeSinceUpdate(status.cache.age_seconds);
      }
    };

    // Initial update
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, status?.cache?.age_seconds]);

  // Refresh cooldown timer
  useEffect(() => {
    if (refreshCooldown <= 0) return;

    const interval = setInterval(() => {
      setRefreshCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshCooldown]);

  const handleRefresh = () => {
    if (refreshCooldown > 0 || isLoading) return;
    setRefreshCooldown(REFRESH_COOLDOWN_SECONDS);
    onRefresh();
  };

  const isRefreshDisabled = refreshCooldown > 0 || isLoading;

  const openStatusPage = () => {
    // Open URL in Steam browser using Decky's Navigation API
    Navigation.NavigateToExternalWeb(STATUS_PAGE_URL);
  };

  const wrapContent = (content: React.ReactNode) => {
    return <PanelSection title={noWrapper ? '' : t('steamStatus')}>{content}</PanelSection>;
  };

  if (error && !status) {
    return wrapContent(
      <>
        <PanelSectionRow>
          <div style={{ color: '#f44336', padding: '8px 0' }}>
            {error}
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleRefresh} disabled={isRefreshDisabled}>
            {isLoading ? t('refreshing') : refreshCooldown > 0 ? `${t('retry')} (${refreshCooldown}s)` : t('retry')}
          </ButtonItem>
        </PanelSectionRow>
      </>
    );
  }

  if (!status) {
    return wrapContent(
      <PanelSectionRow>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          {isLoading ? t('loading') : t('noDataAvailable')}
        </div>
      </PanelSectionRow>
    );
  }

  return wrapContent(
    <>
      {/* Services Status */}
      <PanelSectionRow>
        <div style={{ width: '100%' }}>
          {Object.entries(status.services).map(([name, svc]) => {
            if (!svc) return null; // Skip undefined services (e.g., optional cms)
            const serviceName = t(name as any) || name.charAt(0).toUpperCase() + name.slice(1);
            return (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                }}
              >
                <span>{serviceName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaCircle size={8} color={getStatusColor(svc.status)} />
                  <span style={{ fontSize: '12px', color: getStatusColor(svc.status) }}>
                    {svc.status.charAt(0).toUpperCase() + svc.status.slice(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </PanelSectionRow>

      {/* Connection Managers */}
      {status.cm_regions && status.cm_regions.length > 0 && (
        <ConnectionManagersPanel cmRegions={status.cm_regions} />
      )}


      {/* Trending Games */}
      {settings.show_trending_games && status.trending_games && status.trending_games.length > 0 && (
        <TrendingGamesPanel games={status.trending_games} />
      )}



      {/* Action Buttons */}
      <PanelSectionRow>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid #333',
            marginTop: '8px',
          }}
        >
          <Focusable
            onActivate={handleRefresh}
            onFocus={() => setRefreshFocused(true)}
            onBlur={() => setRefreshFocused(false)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              background: isRefreshDisabled
                ? '#0d0d0d'
                : refreshFocused
                  ? 'rgba(139, 195, 74, 0.2)'
                  : '#1a1a1a',
              borderRadius: '4px',
              cursor: isRefreshDisabled ? 'not-allowed' : 'pointer',
              opacity: isRefreshDisabled ? 0.5 : 1,
              transition: 'background 0.2s ease',
            }}
          >
            <FaSync size={12} className={isLoading ? 'spin' : ''} />
            <span>
              {isLoading ? t('refreshing') : refreshCooldown > 0 ? `${t('refresh')} (${refreshCooldown}s)` : t('refresh')}
            </span>
          </Focusable>

          <Focusable
            onActivate={openStatusPage}
            onFocus={() => setStatusFocused(true)}
            onBlur={() => setStatusFocused(false)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              background: statusFocused ? 'rgba(139, 195, 74, 0.2)' : '#1a1a1a',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            <FaExternalLinkAlt size={12} />
            <span>{t('status')}</span>
          </Focusable>
        </div>
      </PanelSectionRow>

      {/* Footer */}
      <PanelSectionRow>
        <div
          style={{
            fontSize: '11px',
            color: '#888',
            textAlign: 'center',
            paddingTop: '8px',
          }}
        >
          {t('updated')} {formatRelativeTime(timeSinceUpdate)}
          {isOffline && (
            <span style={{ color: '#ff9800', marginLeft: '8px' }}>{t('cached')}</span>
          )}
        </div>
      </PanelSectionRow>

      {/* Error banner if using cached data */}
      {error && (
        <PanelSectionRow>
          <div
            style={{
              fontSize: '11px',
              color: '#ff9800',
              padding: '4px 8px',
              background: 'rgba(255, 152, 0, 0.1)',
              borderRadius: '4px',
            }}
          >
            {error}
          </div>
        </PanelSectionRow>
      )}
    </>
  );
};
