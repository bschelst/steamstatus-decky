import React, { useState } from 'react';
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  Field,
  Navigation,
  showModal,
  Focusable,
} from '@decky/ui';
import { call } from '@decky/api';
import {
  FaCog,
  FaArrowLeft,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaGithub,
  FaNetworkWired,
  FaTachometerAlt,
  FaChevronDown,
  FaChevronUp,
  FaLink,
  FaInfoCircle,
  FaServer,
  FaCircle,
  FaCheckCircle,
  FaUsers,
} from 'react-icons/fa';

import { StatusPanel } from './StatusPanel';
import { Settings } from './Settings';
import HelpModal from './HelpModal';
import { PlayersOnlinePanel } from './PlayersOnlinePanel';
import { useSteamStatus } from '../hooks/useSteamStatus';
import { useOutageDetection, OutageInfo } from '../hooks/useOutageDetection';
import { useSettings } from '../hooks/useSettings';
import useTranslations from '../hooks/useTranslations';
import { SteamStatus } from '../../types/types';
import { PLUGIN_VERSION } from '../constants';

const GITHUB_URL = 'https://github.com/bschelst/steamstatus-decky';

const formatOutageTime = (timestamp: string | null, unknownText: string) => {
  if (!timestamp) return unknownText;
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ServiceStatusSection: React.FC<{ outageInfo: OutageInfo }> = ({ outageInfo }) => {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

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
          <span>{t('serviceStatus')}</span>
        </div>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Focusable>

      {isExpanded && (
        <div style={{ paddingLeft: '12px' }}>
          <PanelSectionRow>
            {outageInfo.hasCurrentOutage ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: 'rgba(244, 67, 54, 0.2)',
                  borderRadius: '8px',
                  borderLeft: '3px solid #f44336',
                }}
              >
                <FaExclamationTriangle size={18} color="#f44336" />
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                    {t('activeOutage')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    {t('steamServicesIssues')}
                  </div>
                </div>
              </div>
            ) : outageInfo.hadRecentOutage ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: 'rgba(255, 152, 0, 0.15)',
                  borderRadius: '8px',
                  borderLeft: '3px solid #ff9800',
                }}
              >
                <FaExclamationTriangle size={18} color="#ff9800" />
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                    {t('recentOutagesDetected')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    {outageInfo.outageCount} {t('outagesInLastHour')}
                    {outageInfo.lastOutageTime && (
                      <span> - {t('lastAt')} {formatOutageTime(outageInfo.lastOutageTime, t('unknown'))}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: 'rgba(76, 175, 80, 0.15)',
                  borderRadius: '8px',
                  borderLeft: '3px solid #4caf50',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#4caf50',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                    {t('allSystemsOperational')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    {t('noOutagesDetected')}
                  </div>
                </div>
              </div>
            )}
          </PanelSectionRow>
        </div>
      )}
    </div>
  );
};

const DiagnosticsSection: React.FC = () => {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [latencyTesting, setLatencyTesting] = useState(false);
  const [latencyResult, setLatencyResult] = useState<string | null>(null);
  const [speedTesting, setSpeedTesting] = useState(false);
  const [speedResult, setSpeedResult] = useState<string | null>(null);
  const [speedProgress, setSpeedProgress] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const testSteamLatency = async () => {
    setLatencyTesting(true);
    setLatencyResult(null);
    try {
      const result = await call<[], { latency_ms: number; cm_server: string }>('test_steam_latency');
      setLatencyResult(`${result.latency_ms}ms (${result.cm_server})`);
    } catch (e) {
      setLatencyResult(t('testFailed') || 'Test failed');
    } finally {
      setLatencyTesting(false);
    }
  };

  const testInternetSpeed = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setSpeedTesting(true);
    setSpeedResult(null);
    setSpeedProgress(0);

    // Simulate progress (since we can't get real progress from backend easily)
    const progressInterval = setInterval(() => {
      setSpeedProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      const result = await call<[], { download_mbps: number; upload_mbps: number }>('test_internet_speed');
      if (!controller.signal.aborted) {
        setSpeedProgress(100);
        setSpeedResult(`↓ ${result.download_mbps.toFixed(1)} Mbps / ↑ ${result.upload_mbps.toFixed(1)} Mbps`);
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setSpeedResult(t('testFailed') || 'Test failed');
      } else {
        setSpeedResult(t('testCancelled') || 'Test cancelled');
      }
    } finally {
      clearInterval(progressInterval);
      setSpeedTesting(false);
      setSpeedProgress(0);
      setAbortController(null);
    }
  };

  const stopSpeedTest = () => {
    if (abortController) {
      abortController.abort();
      setSpeedResult(t('testCancelled') || 'Test cancelled');
      setSpeedTesting(false);
      setSpeedProgress(0);
      setAbortController(null);
    }
  };

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
          <FaNetworkWired size={14} color="#8bc34a" />
          <span>{t('networkDiagnostics')}</span>
        </div>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Focusable>

      {isExpanded && (
        <div style={{ paddingLeft: '12px' }}>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={testSteamLatency}
              disabled={latencyTesting}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaTachometerAlt size={14} />
                <span>{latencyTesting ? t('testing') || 'Testing...' : t('testSteamLatency')}</span>
              </div>
            </ButtonItem>
            {latencyResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
                <FaCheckCircle size={12} color="#8bc34a" />
                <span>{latencyResult}</span>
              </div>
            )}
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={speedTesting ? stopSpeedTest : testInternetSpeed}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaTachometerAlt size={14} />
                <span>{speedTesting ? (t('stop') || 'Stop') : t('testInternetSpeed')}</span>
              </div>
            </ButtonItem>
            {speedTesting && speedProgress > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${speedProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4c9ed9, #66c0f4)',
                    transition: 'width 0.3s ease',
                    borderRadius: '2px'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', textAlign: 'center' }}>
                  {Math.round(speedProgress)}%
                </div>
              </div>
            )}
            {speedResult && !speedTesting && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
                <FaCheckCircle size={12} color="#8bc34a" />
                <span>{speedResult}</span>
              </div>
            )}
          </PanelSectionRow>
        </div>
      )}
    </div>
  );
};

const LinksSection: React.FC = () => {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
          <FaLink size={14} color="#8bc34a" />
          <span>{t('links')}</span>
        </div>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Focusable>

      {isExpanded && (
        <div style={{ paddingLeft: '12px' }}>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => showModal(<HelpModal />)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaQuestionCircle size={14} />
                <span>{t('helpAndDocumentation')}</span>
              </div>
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => Navigation.NavigateToExternalWeb(GITHUB_URL)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaGithub size={14} />
                <span>{t('githubRepository')}</span>
              </div>
            </ButtonItem>
          </PanelSectionRow>
        </div>
      )}
    </div>
  );
};

const AboutSection: React.FC = () => {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
          <FaInfoCircle size={14} color="#8bc34a" />
          <span>{t('about')}</span>
        </div>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Focusable>

      {isExpanded && (
        <div style={{ paddingLeft: '12px' }}>
          <PanelSectionRow>
            <Field label={t('version')} bottomSeparator="none">
              {PLUGIN_VERSION}
            </Field>
          </PanelSectionRow>
        </div>
      )}
    </div>
  );
};

const SettingsSection: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
          <FaCog size={14} color="#8bc34a" />
          <span>{t('settings')}</span>
        </div>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Focusable>

      {isExpanded && (
        <div style={{ paddingLeft: '12px' }}>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={onOpenSettings}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCog size={12} />
                {t('configurePlugin')}
              </div>
            </ButtonItem>
          </PanelSectionRow>
        </div>
      )}
    </div>
  );
};

interface SteamStatusSectionProps {
  status: SteamStatus | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  lastUpdated: number | null;
  onRefresh: () => void;
}

const SteamStatusSection: React.FC<SteamStatusSectionProps> = (props) => {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <>
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
            <FaCircle size={14} color="#8bc34a" />
            <span>{t('steamStatus')}</span>
          </div>
          {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </Focusable>
      </div>

      {isExpanded && (
        <StatusPanel {...props} noWrapper={true} />
      )}
    </>
  );
};

interface PlayersOnlineSectionProps {
  status: SteamStatus | null;
}

const PlayersOnlineSection: React.FC<PlayersOnlineSectionProps> = ({ status }) => {
  const t = useTranslations();
  const [settings] = useSettings();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  if (!status) return null;

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
          <FaUsers size={14} color="#8bc34a" />
          <span>{t('playersOnlineTitle')}</span>
        </div>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Focusable>

      {isExpanded && (
        <div style={{ paddingLeft: '12px' }}>
          <PlayersOnlinePanel
            online={status.online}
            history={status.history}
            showHistory={settings.show_history}
          />
        </div>
      )}
    </div>
  );
};

const Content: React.FC = () => {
  const t = useTranslations();
  const [showSettings, setShowSettings] = useState(false);
  const { status, isLoading, error, isOffline, lastUpdated, refresh } = useSteamStatus();
  const outageInfo = useOutageDetection(status);

  if (showSettings) {
    return (
      <>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => setShowSettings(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaArrowLeft size={12} />
              {t('backToStatus')}
            </div>
          </ButtonItem>
        </PanelSectionRow>
        <Settings />
      </>
    );
  }

  return (
    <>
      {/* Outage Banner */}
      {(outageInfo.hasCurrentOutage || outageInfo.hadRecentOutage) && (
        <PanelSectionRow>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: outageInfo.hasCurrentOutage
                ? 'rgba(244, 67, 54, 0.2)'
                : 'rgba(255, 152, 0, 0.15)',
              borderRadius: '6px',
              borderLeft: `3px solid ${outageInfo.hasCurrentOutage ? '#f44336' : '#ff9800'}`,
              marginBottom: '8px',
            }}
          >
            <FaExclamationTriangle
              size={14}
              color={outageInfo.hasCurrentOutage ? '#f44336' : '#ff9800'}
            />
            <span style={{ fontSize: '12px' }}>
              {outageInfo.hasCurrentOutage
                ? t('serviceOutageDetected')
                : `${outageInfo.outageCount} ${t('outagesInLastHourShort')}`}
            </span>
          </div>
        </PanelSectionRow>
      )}

      {/* Steam Status Section */}
      <SteamStatusSection
        status={status}
        isLoading={isLoading}
        error={error}
        isOffline={isOffline}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      {/* Players Online Section */}
      <PlayersOnlineSection status={status} />

      {/* Service Status Section */}
      <ServiceStatusSection outageInfo={outageInfo} />

      {/* Network Diagnostics Section */}
      <DiagnosticsSection />

      {/* Links Section */}
      <LinksSection />

      {/* About Section */}
      <AboutSection />

      {/* Settings Section */}
      <SettingsSection onOpenSettings={() => setShowSettings(true)} />
    </>
  );
};

export default Content;
