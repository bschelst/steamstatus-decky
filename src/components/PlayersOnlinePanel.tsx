import React, { useState } from 'react';
import { PanelSectionRow, Focusable } from '@decky/ui';
import { FaChevronDown, FaChevronUp, FaUsers } from 'react-icons/fa';
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
  const [isExpanded, setIsExpanded] = useState(true); // Expanded by default

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
    <div style={{ marginTop: '8px' }}>
      <Focusable
        onActivate={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaUsers size={14} color="#8bc34a" />
          <span>{t('playersOnlineTitle')}</span>
        </div>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Focusable>

      {isExpanded && (
        <div style={{ paddingLeft: '12px' }}>
          <PanelSectionRow>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>{t('playersOnline')}</span>
              <span style={{ fontWeight: 'bold' }}>
                {formatPlayerCount(online)}
              </span>
            </div>
          </PanelSectionRow>
          {showHistory && historyStats.max !== null && (
            <>
              <PanelSectionRow>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>{t('maxPlayersLastDay')}</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {formatPlayerCount(historyStats.max)}
                  </span>
                </div>
              </PanelSectionRow>
              <PanelSectionRow>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>{t('avgPlayersLastDay')}</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {formatPlayerCount(historyStats.average!)}
                  </span>
                </div>
              </PanelSectionRow>
            </>
          )}
          {showHistory && history && history.length > 0 && (
            <PanelSectionRow>
              <div style={{ padding: '4px 0', width: '100%' }}>
                <Sparkline history={history} />
              </div>
            </PanelSectionRow>
          )}
        </div>
      )}
    </div>
  );
};
