# Changelog

## [1.2.0] - 2026-04-26

### Changed
- Replaced deprecated `request` package (critical CVEs) with native `http` module
- Upgraded `express` from 4.18 to 4.22 (fixes ReDoS and XSS vulnerabilities)
- Removed unused `node-fetch` dependency
- Extracted shared timestamp logger into `logger.js`
- Fixed bug where the inverter response was never forwarded back to the client

## [1.1.0] - 2026-04-26

### Changed
- All log output now includes an ISO 8601 timestamp prefix

## [1.0.0] - 2026-04-26

### Added
- Initial Home Assistant addon release based on [sergioperez/fronius-auth-proxy](https://github.com/sergioperez/fronius-auth-proxy)
- Addon configuration for Fronius inverter hostname, port, username, and password
- Multi-arch support (amd64, aarch64, armv7, armhf, i386)
- `repository.yaml` for Home Assistant addon store compatibility
