# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-08-23

### Added

- Enforce changelog updates via GitHub Actions workflow.
- Claude PR assistant and automated code review workflows.
- Popular runes normalizer (id/name/icon) with centralized mapping and de-duplication.
- Fee selector with mempool.space rates and improved fee/UX handling.
- Comprehensive test coverage for core hooks and APIs (e.g., useSwapExecution, useRunesSearch, useBorrowQuotes).

### Changed

- Major performance and infrastructure optimizations; organized codebase and consolidated API infrastructure.
- Extracted repeated logic into shared hooks/utilities; switched to absolute `@/` imports.
- Centralized Liquidium API handling and aligned server routes with generated SDK types.
- Adopted Big.js for precise financial calculations across swap/borrow flows.
- Improved error handling and validation across API routes and UI.
- Enabled Next Image optimizations and refined image remote patterns.
- Tightened TypeScript strictness and stabilized Jest/jsdom test environment.

### Fixed

- Resolved borrow quotes infinite loop and memory issues in tests.
- Handled Ordiscan 404 responses; corrected Liquidium API domain.
- Improved collateral amount precision handling and validation.
- Prevented stale selections in popular runes; preserved swap error states.
- Addressed SSR and import issues (Suspense wrap, case-sensitive paths, Loading component imports).
- Reduced local rate-limit hits to SatsTerminal; standardized quote response format.

### Removed

- Removed legacy `TBA_API_URL` usage and 98.css remnants.
- Removed obsolete scripts and miscellaneous unused configuration.

### Security

- Restricted error log details in production API responses.

## [0.2.0] - 2025-05-20

### Added

- Borrow functionality and Liquidium OpenAPI context; portfolio and repay flow.
- Improved error handling and caching layers.
- Test scaffolding and initial test suites.
- Project tooling: ESLint, Prettier, Husky, lint-staged, Stylelint.

### Changed

- Updated Liquidium auth to respect proper RLS policies.
- UI/UX refinements: layout tweaks, chart formatting, and consistency.

### Fixed

- Addressed multiple review feedback items and refined LTV display/formatting.
- Ensured ES2020 compatibility for BigInt usage.
- Enabled retry of loan process after cancellation in Xverse wallet.

## [0.1.5] - 2025-04-26

### Changed

- Removed alpha disclaimer; updated styles.
- Added percentage shortcuts for balance input in SwapTab.

## [0.1.4] - 2025-04-23

### Added

- Updated logo and basic SEO improvements.
- Price chart updates (sats display and more accurate data).

### Changed

- Addressed review nitpicks; refined layout and responsiveness.
- Updated to SatsTerminal 1.6.7; improved `.env.example` guidance.

### Removed

- Removed redundant files and unused cursor rules.

## [0.1.3] - 2025-04-23

### Added

- Debug logging for validatedParams in quote API route.

### Changed

- Prevented race conditions in quote fetching; ensure state updates only for latest request.
- Layout/styling updates for AppInterface and overall responsiveness.

## [0.1.2] - 2025-04-23

### Changed

- Enhanced PriceChart: forward-fill missing hourly data; improved type-safety and performance.

## [0.1.1] - 2025-04-23

### Fixed

- Fixed LaserEyes wallet unmount behavior; updated cursor rules.

## [0.1.0] - 2025-04-23

### Added

- Initial release: swap interface, price chart, core API routes and foundational UI.
[0.2.1]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ropl-btc/RunesSwap.app/releases/tag/v0.1.0
