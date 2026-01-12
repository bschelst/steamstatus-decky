import React from 'react';
import { PanelSectionRow } from '@decky/ui';
import { HistoryEntry } from '../../types/types';
import { formatPlayerCount } from '../utils/formatters';
import { Sparkline } from './Sparkline';
import useTranslations from '../hooks/useTranslations';

interface PlayersOnlinePanelProps {
  online: number;
  history?: HistoryEntry[];
  showHistory: boolean;
}

export const PlayersOnlinePanel: React.FC<PlayersOnlinePanelProps> = ({
  online,
  history,
  showHistory,
}) => {
  const t = useTranslations();

  // Calculate max and average from history (excluding 0 values from API outages)
  const historyStats = React.useMemo(() => {
    if (!history || history.length === 0) {
      return { max: null, average: null };
    }
    const values = history.map((h) => h.online).filter((v) => v > 0);
    if (values.length === 0) {
      return { max: null, average: null };
    }
    const max = Math.max(...values);
    const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    return { max, average };
  }, [history]);

  return (
    <>
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span>{t('playersOnline')}</span>
          <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {formatPlayerCount(online)}
          </span>
        </div>
      </div>
      {showHistory && historyStats.max !== null && (
        <>
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span>{t('maxPlayersLastDay')}</span>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                {formatPlayerCount(historyStats.max)}
              </span>
            </div>
          </div>
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span>{t('avgPlayersLastDay')}</span>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                {formatPlayerCount(historyStats.average!)}
              </span>
            </div>
          </div>
        </>
      )}
      {showHistory && history && history.length > 0 && (
        <PanelSectionRow>
          <div style={{ padding: '4px 0', width: '100%' }}>
            <Sparkline history={history} />
          </div>
        </PanelSectionRow>
      )}
    </>
  );
};
