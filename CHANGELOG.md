# Changelog

All important changes are mentioned here.


## [1.2.2] - 2026-01-12

### Fixed
- **Outage tracker startup bug**: Gateway outage tracker now properly handles services that are already down when the gateway starts. Previously, only state transitions were tracked, causing simulated outages or real outages present at startup to never be logged.
- **Notification icon size**: Notifications now use the correct `logo` property instead of `icon`, matching the standard Steam Deck notification appearance. Icons are now properly sized and consistent with system notifications.

### Changed
- **Improved UI organization**: Network Diagnostics, Links, About, and Settings sections are now collapsed by default for a cleaner interface. Steam Status, Players Online, and Service Status remain expanded.
- **Interactive notifications**: Clicking on outage or recovery notifications now opens the status dashboard in the browser for detailed information.

### Security
- **API key redaction in console logs**: Gateway API key is now redacted in all console.log output, displaying as `***REDACTED***` instead of the actual key. The key is still used normally for API requests but is no longer visible in browser developer console logs.

## [1.2.1] - 2026-01-11

### Added
- **Network diagnostics tools**: Test Steam connection latency and internet speed directly from the plugin
  - **Steam CM latency test**: Fetches official Connection Manager server list from Steam API and tests a sample to find your best connection. Location-aware testing provides accurate latency to your nearest Steam servers
  - **Internet speed test**: Downloads 100MB file to measure download speed and estimate upload speed. Includes progress bar and stop button
  - Test results display with green checkmark icons for better visual feedback
- **Improved UI organization**: All major sections (Steam Status, Service Status, Network Diagnostics, Links, About, Settings) are now collapsible with consistent green icons for better navigation
- **Enhanced help documentation**: Added comprehensive descriptions for network diagnostics tests and all plugin settings, explaining their purpose and behavior
- **Visual improvements**: README.md now includes emojis throughout for better readability and visual appeal

### Changed
- Steam Status section is now collapsible but expanded by default for quick access to main status information

## [1.2.0] - 2026-01-10

### Added
- **Notification anti-flood protection**: Configurable rate limiting prevents notification spam during gateway or API issues. Users can enable or disable this feature in settings (enabled by default).

## [1.1.0] - 2026-01-09

### Added
- **Outage confirmation mechanism**: Services must be offline for 2 consecutive checks before an outage is reported and notifications are sent. This prevents false alerts from transient single-heartbeat failures.
- **Complete internationalization support**: Added translations for 29 Steam languages:
  - English, Dutch, German, French, Spanish, Italian, Portuguese, Brazilian Portuguese
  - Russian, Simplified Chinese, Traditional Chinese, Japanese, Korean
  - Polish, Turkish, Thai, Swedish, Norwegian, Danish, Finnish
  - Hungarian, Czech, Romanian, Bulgarian, Greek, Ukrainian
  - Vietnamese, Indonesian, Arabic, Latin American Spanish
- Steam locale aliases for better language detection (e.g., `schinese` → Simplified Chinese)

### Fixed
- **"Outages Last Hour" display**: Now uses actual outage log data instead of 10-minute history snapshots. This ensures short-lived outages are correctly tracked and displayed in the UI.
- Outage detection now properly distinguishes between pending (unconfirmed) and confirmed outages

### Changed
- Gateway outage tracker now maintains separate tracking for pending and confirmed outages
- Notifications are only sent for confirmed outages (after 1-minute confirmation period)
- API response includes `recent_outages` field with detailed outage events from the last 24 hours

## [1.0.0] - 2025-01-07

### Added
- Initial release
- Real-time Steam service status monitoring (Store, Community, WebAPI, Connection Managers)
- Online player count display with 24-hour history
- Service outage detection and logging
- Automatic notifications for service outages and recovery
- Connection Manager status across 27 global regions
- Trending games display (Steam Deck verified/playable games)
- Historical player count sparkline graph
- Configurable refresh intervals
- Offline mode with cached data
- Auto-update functionality
- Gateway-based architecture for efficient data fetching
- Decky Loader plugin interface

[1.2.2]: https://github.com/bschelst/steamstatus-decky/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/bschelst/steamstatus-decky/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/bschelst/steamstatus-decky/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/bschelst/steamstatus-decky/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/bschelst/steamstatus-decky/releases/tag/v1.0.0
