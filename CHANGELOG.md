# Changelog

## [1.4.0] - 2026-08-03

### Added
- HTTPS support for connecting to the inverter (`fronius_https` addon option / `https` query param / `FRONIUS_HTTPS` env var) — needed for inverters like the GEN24/Primo that serve their API over HTTPS
- `fronius_reject_unauthorized` addon option (`rejectUnauthorized` query param / `FRONIUS_REJECT_UNAUTHORIZED` env var) to control TLS certificate verification; defaults to `false` since Fronius devices typically use a self-signed certificate
- Port now defaults to `443` instead of `80` when HTTPS is enabled and no explicit port is given

## [1.3.1] - 2026-04-26

### Fixed
- `logger.js` was missing from the Dockerfile `COPY` instruction, causing a `MODULE_NOT_FOUND` crash on startup

## [1.3.0] - 2026-04-26

### Added
- CI workflow (GitHub Actions) — runs tests on every push and pull request
- Dependabot config — weekly updates for npm and GitHub Actions dependencies
- Jest test suite covering `logger.js`, `proxy.js`, and `makeRequest.js` (11 tests)

### Changed
- `proxy.js` exports the Express app so tests can import it without starting the server

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
