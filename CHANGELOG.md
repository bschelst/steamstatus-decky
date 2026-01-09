# Changelog

All important changes are mentioned here.


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

[1.1.0]: https://github.com/bschelst/steamstatus-decky/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/bschelst/steamstatus-decky/releases/tag/v1.0.0
