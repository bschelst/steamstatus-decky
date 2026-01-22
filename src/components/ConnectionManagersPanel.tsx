import React, { useState } from 'react';
import { PanelSectionRow, Focusable, Navigation } from '@decky/ui';
import { FaChevronDown, FaChevronUp, FaServer, FaCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { CMRegion } from '../../types/types';
import { getStatusColor } from '../utils/formatters';
import useTranslations from '../hooks/useTranslations';

const GATEWAY_URL = 'https://steamstatus.schelstraete.org/status';

interface ConnectionManagersPanelProps {
  cmRegions: CMRegion[];
}

export const ConnectionManagersPanel: React.FC<ConnectionManagersPanelProps> = ({ cmRegions }) => {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);

  const handleRegionClick = (region: string) => {
    // Open gateway status page with region parameter to auto-open modal
    const encodedRegion = encodeURIComponent(region);
    const urlWithRegion = `${GATEWAY_URL}?region=${encodedRegion}`;
    Navigation.NavigateToExternalWeb(urlWithRegion);
  };

  if (!cmRegions || cmRegions.length === 0) {
    return null;
  }

  const allOnline = cmRegions.every((cm) => cm.status === 'online');

  return (
    <div style={{ marginTop: '8px' }}>
      <Focusable
        onActivate={() => setIsExpanded(!isExpanded)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px',
          cursor: 'pointer',
          borderRadius: '4px',
          background: isFocused ? 'rgba(139, 195, 74, 0.1)' : 'transparent',
          transition: 'background 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaServer size={14} color="#8bc34a" />
          <span>{t('connectionManagers')}</span>
          <FaCircle
            size={8}
            color={allOnline ? '#4caf50' : '#ff9800'}
          />
        </div>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Focusable>

      {isExpanded && (
        <div style={{ paddingLeft: '12px' }}>
          {cmRegions.map((cm) => (
            <PanelSectionRow key={cm.region}>
              <Focusable
                onActivate={() => handleRegionClick(cm.region)}
                onFocus={() => setFocusedRegion(cm.region)}
                onBlur={() => setFocusedRegion(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: focusedRegion === cm.region ? 'rgba(102, 192, 244, 0.1)' : 'transparent',
                  transition: 'background 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{cm.flag}</span>
                  <span style={{ fontSize: '13px' }}>{cm.region}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaCircle size={8} color={getStatusColor(cm.status)} />
                  <span style={{ fontSize: '12px', color: getStatusColor(cm.status) }}>
                    {cm.status.charAt(0).toUpperCase() + cm.status.slice(1)}
                  </span>
                  {focusedRegion === cm.region && (
                    <FaExternalLinkAlt size={10} style={{ marginLeft: '4px', opacity: 0.6 }} />
                  )}
                </div>
              </Focusable>
            </PanelSectionRow>
          ))}
        </div>
      )}
    </div>
  );
};
