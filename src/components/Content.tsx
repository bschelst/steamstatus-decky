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
import { call, fetchNoCors } from '@decky/api';
import {
  FaCog,
  FaArrowLeft,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaGithub,
  FaDownload,
  FaSync,
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
import { useLatestVersion } from '../hooks/useLatestVersion';
import { useSettings } from '../hooks/useSettings';
import useTranslations from '../hooks/useTranslations';
import { SteamStatus } from '../../types/types';

const GITHUB_URL = 'https://github.com/bschelst/steamstatus-decky';
const PLUGIN_UPDATE_URL = 'https://github.com/bschelst/steamstatus-decky/releases/latest/download/steamstatus-decky.zip';

type UpdateStatus = 'idle' | 'checking' | 'downloading' | 'installing' | 'completed' | 'failed';

// Check if a URL exists (file is available for download)
async function checkUpdateFileExists(url: string): Promise<boolean> {
  console.log('[SteamStatus] Checking if update file exists:', url);
  try {
    // Use fetchNoCors to bypass CORS restrictions on Steam Deck
    const response = await fetchNoCors(url, { method: 'HEAD' });
    console.log('[SteamStatus] HEAD request status:', response.status);
    return response.ok;
  } catch (e) {
    console.error('[SteamStatus] HEAD request failed:', e);
    // If HEAD fails, try a GET request (some servers don't support HEAD)
    try {
      console.log('[SteamStatus] Trying GET request instead...');
      const response = await fetchNoCors(url, { method: 'GET' });
      console.log('[SteamStatus] GET request status:', response.status);
      return response.ok;
    } catch (e2) {
      console.error('[SteamStatus] GET request also failed:', e2);
      return false;
    }
  }
}

// Install plugin from URL using Decky's internal API
async function installPluginUpdate(
  url: string,
  onStatusChange: (status: UpdateStatus) => void
): Promise<string | undefined> {
  console.log('[SteamStatus] Starting plugin update...');
  console.log('[SteamStatus] Update URL:', url);

  // First check if the file exists
  onStatusChange('checking');
  const fileExists = await checkUpdateFileExists(url);
  if (!fileExists) {
    console.error('[SteamStatus] Update file does not exist at URL:', url);
    throw new Error('Update file not found');
  }
  console.log('[SteamStatus] Update file exists, proceeding with download...');

  // Start downloading
  onStatusChange('downloading');

  // Try using Decky's internal plugin loader API
  const DeckyPluginLoader = (window as any).DeckyPluginLoader;
  console.log('[SteamStatus] DeckyPluginLoader available:', !!DeckyPluginLoader);
  console.log('[SteamStatus] DeckyPluginLoader.installPlugin available:', !!DeckyPluginLoader?.installPlugin);

  if (DeckyPluginLoader?.installPlugin) {
    console.log('[SteamStatus] Using DeckyPluginLoader.installPlugin()...');
    try {
      onStatusChange('installing');
      const result = await DeckyPluginLoader.installPlugin(url);
      console.log('[SteamStatus] installPlugin result:', result);
      onStatusChange('completed');
      return;
    } catch (e) {
      console.error('[SteamStatus] DeckyPluginLoader.installPlugin failed:', e);
      throw e;
    }
  }

  // First test if Python backend is responsive
  console.log('[SteamStatus] Testing Python backend...');
  try {
    const testResult = await call<[], { success: boolean; message: string }>('test_backend');
    console.log('[SteamStatus] test_backend result:', testResult);
  } catch (e) {
    console.error('[SteamStatus] test_backend failed:', e);
    throw new Error('Python backend not responding');
  }

  // Call the Python backend to download and install with timeout
  console.log('[SteamStatus] Calling Python backend install_plugin...');
  onStatusChange('installing');

  // Create a timeout promise (60 seconds)
  const INSTALL_TIMEOUT_MS = 60000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Installation timed out after 60 seconds'));
    }, INSTALL_TIMEOUT_MS);
  });

  try {
    const resultPromise = call<[string], { success: boolean; message: string; needsManualInstall?: boolean }>('install_plugin', url);

    // Race between the actual call and the timeout
    const result = await Promise.race([resultPromise, timeoutPromise]);
    console.log('[SteamStatus] install_plugin result:', result);

    if (result && result.success) {
      onStatusChange('completed');
      // Return the message for display
      return result.message;
    } else {
      throw new Error(result?.message || 'Installation failed');
    }
  } catch (e) {
    console.error('[SteamStatus] install_plugin failed:', e);
    throw e;
  }
}

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

const getUpdateStatusText = (status: UpdateStatus, t: ReturnType<typeof useTranslations>): string => {
  switch (status) {
    case 'checking': return t('updateChecking') || 'Checking...';
    case 'downloading': return t('updateDownloading') || 'Downloading...';
    case 'installing': return t('updateInstalling') || 'Installing...';
    case 'completed': return t('updateCompleted') || 'Completed!';
    case 'failed': return t('updateFailed') || 'Update failed';
    default: return '';
  }
};


const AboutSection: React.FC = () => {
  const t = useTranslations();
  const [settings] = useSettings();
  const { currentVersion, latestVersion, isLoading, updateAvailable } = useLatestVersion(
    settings.check_for_updates
  );
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isUpdating = updateStatus !== 'idle' && updateStatus !== 'completed' && updateStatus !== 'failed';

  const handleUpdate = async () => {
    console.log('[SteamStatus] Update button clicked');
    console.log('[SteamStatus] Current version:', currentVersion);
    console.log('[SteamStatus] Latest version:', latestVersion);
    setUpdateStatus('checking');
    setUpdateError(null);
    try {
      const message = await installPluginUpdate(PLUGIN_UPDATE_URL, setUpdateStatus);
      console.log('[SteamStatus] Update completed successfully');
      // Show the install instructions
      if (message) {
        setUpdateError(message);
      }
    } catch (e) {
      console.error('[SteamStatus] Failed to update plugin:', e);
      setUpdateStatus('failed');
      setUpdateError(e instanceof Error ? e.message : 'Update failed');
      // Reset to idle after 60 seconds so user can retry
      setTimeout(() => {
        setUpdateStatus('idle');
        setUpdateError(null);
      }, 60000);
    } finally {
      console.log('[SteamStatus] Update process finished');
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
          <FaInfoCircle size={14} color="#8bc34a" />
          <span>{t('about')}</span>
        </div>
        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Focusable>

      {isExpanded && (
        <div style={{ paddingLeft: '12px' }}>
          <PanelSectionRow>
            <Field label={t('version')} bottomSeparator="none">
              {currentVersion}
            </Field>
          </PanelSectionRow>
          {settings.check_for_updates && (
            <PanelSectionRow>
              <Field label={t('latestVersion')} bottomSeparator="none">
                {isLoading ? '...' : latestVersion || '?'}
              </Field>
            </PanelSectionRow>
          )}
          {settings.check_for_updates && (updateAvailable || updateStatus !== 'idle') && (
            <PanelSectionRow>
              {updateStatus === 'completed' ? (
                <ButtonItem
                  layout="below"
                  disabled={true}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                    <FaSync size={14} />
                    <span>{t('restartDecky') || 'Restart Decky Loader'}</span>
                  </div>
                </ButtonItem>
              ) : (
                <ButtonItem
                  layout="below"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaDownload size={14} />
                    <span>
                      {isUpdating
                        ? getUpdateStatusText(updateStatus, t)
                        : updateStatus === 'failed'
                          ? t('updateFailed') || 'Update failed - Retry?'
                          : t('updateToVersion', { version: latestVersion })}
                    </span>
                  </div>
                </ButtonItem>
              )}
            </PanelSectionRow>
          )}
          {updateError && (
            <PanelSectionRow>
              <div style={{ fontSize: '11px', color: '#f44336' }}>{updateError}</div>
            </PanelSectionRow>
          )}
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
