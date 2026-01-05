import React from 'react';
import {
  PanelSection,
  PanelSectionRow,
  TextField,
  SliderField,
  ToggleField,
} from '@decky/ui';
import { useSettings } from '../hooks/useSettings';
import useTranslations from '../hooks/useTranslations';

export const Settings: React.FC = () => {
  const t = useTranslations();
  const [settings, updateSetting] = useSettings();

  return (
    <>
      <PanelSection title={t('displayOptions')}>
        <PanelSectionRow>
          <TextField
            label={t('statusPageUrl')}
            description={t('statusPageUrlDesc')}
            value={settings.status_page_url}
            onChange={(e) => updateSetting('status_page_url', e.target.value)}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <SliderField
            label={t('refreshInterval')}
            description={t('refreshIntervalDesc')}
            value={settings.refresh_interval_seconds}
            min={300}
            max={1800}
            step={300}
            notchCount={6}
            notchLabels={[
              { notchIndex: 0, label: '5m' },
              { notchIndex: 1, label: '10m' },
              { notchIndex: 2, label: '15m' },
              { notchIndex: 3, label: '20m' },
              { notchIndex: 4, label: '25m' },
              { notchIndex: 5, label: '30m' },
            ]}
            onChange={(value) => updateSetting('refresh_interval_seconds', value)}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ToggleField
            label={t('showHistory')}
            description={t('showHistoryDesc')}
            checked={settings.show_history}
            onChange={(value) => updateSetting('show_history', value)}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ToggleField
            label={t('showTrendingGames')}
            description={t('showTrendingGamesDesc')}
            checked={settings.show_trending_games}
            onChange={(value) => updateSetting('show_trending_games', value)}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ToggleField
            label={t('checkForUpdates')}
            description={t('checkForUpdatesDesc')}
            checked={settings.check_for_updates}
            onChange={(value) => updateSetting('check_for_updates', value)}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title={t('notifications')}>
        <PanelSectionRow>
          <ToggleField
            label={t('enableNotifications')}
            description={t('enableNotificationsDesc')}
            checked={settings.enable_notifications}
            onChange={(value) => updateSetting('enable_notifications', value)}
          />
        </PanelSectionRow>
      </PanelSection>
    </>
  );
};
