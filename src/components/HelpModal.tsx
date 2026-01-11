import React, { FC, useRef } from 'react';
import { ConfirmModal, DialogButton, Focusable } from '@decky/ui';
import {
  FaBook,
  FaCog,
  FaSteam,
  FaChartLine,
  FaBell,
  FaServer,
  FaInfoCircle,
  FaGamepad,
  FaDownload,
  FaNetworkWired,
  FaTachometerAlt,
} from 'react-icons/fa';
import useTranslations from '../hooks/useTranslations';

interface HelpModalProps {
  closeModal?: () => void;
}

const SectionHeader: FC<{ icon: React.ReactNode; title: string }> = ({
  icon,
  title,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px',
      paddingBottom: '8px',
      borderBottom: '1px solid rgba(255,255,255,0.2)',
    }}
  >
    <span style={{ fontSize: '20px' }}>{icon}</span>
    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{title}</span>
  </div>
);

const HelpSection: FC<{
  children: React.ReactNode;
  sectionRef?: React.RefObject<HTMLDivElement>;
}> = ({ children, sectionRef }) => (
  <div
    ref={sectionRef}
    style={{
      padding: '16px',
      marginBottom: '16px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
    }}
  >
    {children}
  </div>
);

const TocButton: FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <DialogButton
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      minWidth: 'auto',
      fontSize: '12px',
    }}
  >
    {icon}
    <span>{label}</span>
  </DialogButton>
);

const HelpModal: FC<HelpModalProps> = ({ closeModal }) => {
  const t = useTranslations();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const disclaimerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && scrollContainerRef.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <ConfirmModal
      strTitle={t('helpTitle')}
      strOKButtonText={t('close')}
      onOK={closeModal}
      onCancel={closeModal}
      bHideCloseIcon={false}
    >
      {/* Table of Contents */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            opacity: 0.7,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {t('jumpToSection')}
        </div>
        <Focusable
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <TocButton
            icon={<FaBook size={14} />}
            label={t('about')}
            onClick={() => scrollToSection(aboutRef)}
          />
          <TocButton
            icon={<FaSteam size={14} />}
            label={t('statusInfo')}
            onClick={() => scrollToSection(statusRef)}
          />
          <TocButton
            icon={<FaCog size={14} />}
            label={t('features')}
            onClick={() => scrollToSection(featuresRef)}
          />
          <TocButton
            icon={<FaInfoCircle size={14} />}
            label={t('disclaimer')}
            onClick={() => scrollToSection(disclaimerRef)}
          />
        </Focusable>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollContainerRef}
        style={{
          maxHeight: '50vh',
          overflow: 'auto',
          scrollBehavior: 'smooth',
        }}
      >
        <Focusable style={{ padding: '4px' }}>
          {/* About Section */}
          <Focusable
            onFocus={(e: React.FocusEvent<HTMLDivElement>) =>
              e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          >
            <HelpSection sectionRef={aboutRef}>
              <SectionHeader icon={<FaBook />} title={t('aboutSteamStatus')} />
              <p style={{ lineHeight: '1.6', marginBottom: '8px' }}>
                {t('aboutSteamStatusDesc')}
              </p>
            </HelpSection>
          </Focusable>

          {/* Status Info Section */}
          <Focusable
            onFocus={(e: React.FocusEvent<HTMLDivElement>) =>
              e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          >
            <HelpSection sectionRef={statusRef}>
              <SectionHeader icon={<FaSteam />} title={t('understandingStatus')} />

              <div style={{ marginBottom: '16px' }}>
                <strong>{t('playerCounts')}</strong>
                <ul
                  style={{
                    marginTop: '8px',
                    paddingLeft: '20px',
                    lineHeight: '1.6',
                  }}
                >
                  <li>
                    <strong>{t('playersOnline')}</strong> {t('playersOnlineDesc')}
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>{t('serviceStatusLabel')}</strong>
                <ul
                  style={{
                    marginTop: '8px',
                    paddingLeft: '20px',
                    lineHeight: '1.6',
                  }}
                >
                  <li>
                    <span style={{ color: '#4caf50' }}>{t('statusOnline')}</span> - {t('statusOnlineDesc')}
                  </li>
                  <li>
                    <span style={{ color: '#ff9800' }}>{t('statusDegraded')}</span> - {t('statusDegradedDesc')}
                  </li>
                  <li>
                    <span style={{ color: '#f44336' }}>{t('statusOffline')}</span> - {t('statusOfflineDesc')}
                  </li>
                </ul>
              </div>

              <div>
                <strong>{t('steamServicesMonitored')}</strong>
                <ul
                  style={{
                    marginTop: '8px',
                    paddingLeft: '20px',
                    lineHeight: '1.6',
                  }}
                >
                  <li>
                    <strong>{t('store')}</strong> - {t('storeDesc')}
                  </li>
                  <li>
                    <strong>{t('community')}</strong> - {t('communityDesc')}
                  </li>
                  <li>
                    <strong>{t('webapi')}</strong> - {t('webapiDesc')}
                  </li>
                  <li>
                    <strong>{t('connectionManagers')}</strong> - {t('connectionManagersStatusDesc')}
                  </li>
                </ul>
              </div>
            </HelpSection>
          </Focusable>

          {/* Features Section */}
          <Focusable
            onFocus={(e: React.FocusEvent<HTMLDivElement>) =>
              e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          >
            <HelpSection sectionRef={featuresRef}>
              <SectionHeader icon={<FaCog />} title={t('features')} />

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <FaChartLine size={14} />
                  <strong>{t('historySparkline')}</strong>
                </div>
                <p style={{ lineHeight: '1.5', marginLeft: '22px' }}>
                  {t('historySparklineDesc')}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <FaServer size={14} />
                  <strong>{t('connectionManagersStatus')}</strong>
                </div>
                <p style={{ lineHeight: '1.5', marginLeft: '22px' }}>
                  {t('connectionManagersStatusDesc')}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <FaBell size={14} />
                  <strong>{t('outageNotifications')}</strong>
                </div>
                <p style={{ lineHeight: '1.5', marginLeft: '22px' }}>
                  {t('outageNotificationsDesc')}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <FaCog size={14} />
                  <strong>{t('offlineMode')}</strong>
                </div>
                <p style={{ lineHeight: '1.5', marginLeft: '22px' }}>
                  {t('offlineModeDesc')}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <FaGamepad size={14} />
                  <strong>{t('trendingGamesFeature')}</strong>
                </div>
                <p style={{ lineHeight: '1.5', marginLeft: '22px' }}>
                  {t('trendingGamesFeatureDesc')}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <FaDownload size={14} />
                  <strong>{t('autoUpdateFeature')}</strong>
                </div>
                <p style={{ lineHeight: '1.5', marginLeft: '22px' }}>
                  {t('autoUpdateFeatureDesc')}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <FaNetworkWired size={14} />
                  <strong>{t('networkDiagnosticsFeature')}</strong>
                </div>
                <p style={{ lineHeight: '1.5', marginLeft: '22px', marginBottom: '12px' }}>
                  {t('networkDiagnosticsFeatureDesc')}
                </p>
                <div style={{ marginLeft: '22px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <FaTachometerAlt size={12} style={{ opacity: 0.7 }} />
                      <strong style={{ fontSize: '13px' }}>{t('steamLatencyTest')}</strong>
                    </div>
                    <p style={{ lineHeight: '1.4', fontSize: '12px', opacity: 0.85 }}>
                      {t('steamLatencyTestDesc')}
                    </p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <FaTachometerAlt size={12} style={{ opacity: 0.7 }} />
                      <strong style={{ fontSize: '13px' }}>{t('internetSpeedTest')}</strong>
                    </div>
                    <p style={{ lineHeight: '1.4', fontSize: '12px', opacity: 0.85 }}>
                      {t('internetSpeedTestDesc')}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <FaCog size={14} />
                  <strong>{t('settingsFeature')}</strong>
                </div>
                <p style={{ lineHeight: '1.5', marginLeft: '22px', marginBottom: '12px' }}>
                  Configure plugin behavior and appearance.
                </p>
                <div style={{ marginLeft: '22px', fontSize: '13px' }}>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>{t('settingsRefreshInterval')}</strong> - {t('settingsRefreshIntervalDesc')}
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>{t('settingsShowHistory')}</strong> - {t('settingsShowHistoryDesc')}
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>{t('settingsShowTrendingGames')}</strong> - {t('settingsShowTrendingGamesDesc')}
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>{t('settingsCheckForUpdates')}</strong> - {t('settingsCheckForUpdatesDesc')}
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>{t('settingsEnableNotifications')}</strong> - {t('settingsEnableNotificationsDesc')}
                    </li>
                    <li>
                      <strong>{t('settingsEnableNotificationAntiflood')}</strong> - {t('settingsEnableNotificationAntifloodDesc')}
                    </li>
                  </ul>
                </div>
              </div>
            </HelpSection>
          </Focusable>

          {/* Disclaimer Section */}
          <Focusable
            onFocus={(e: React.FocusEvent<HTMLDivElement>) =>
              e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          >
            <HelpSection sectionRef={disclaimerRef}>
              <SectionHeader icon={<FaInfoCircle />} title={t('disclaimer')} />
              <p style={{ lineHeight: '1.6', marginBottom: '12px' }}>
                {t('disclaimerText1')}
              </p>
              <p style={{ lineHeight: '1.6', marginBottom: '12px' }}>
                {t('disclaimerText2')}
              </p>
              <p style={{ lineHeight: '1.6' }}>
                {t('disclaimerText3')}
              </p>
            </HelpSection>
          </Focusable>
        </Focusable>
      </div>
    </ConfirmModal>
  );
};

export default HelpModal;
