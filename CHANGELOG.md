## [Unreleased]
### Fixed
- Enforced Zod response validation in `src/app/api/ordiscan/btc-balance/route.ts`.
- Replaced ad-hoc query checks with Zod-based validation in `src/app/api/ordiscan/rune-info-by-id/route.ts`.
- Removed unsafe assertions in `src/hooks/useSwapExecution.ts` by introducing `PsbtApiResponse` and a type guard; deduplicated `SwapConfirmationResult`; fixed finally-block to avoid stale state success re-dispatch.
# Changelog
## [Unreleased]

### Added
- Optional `NEXT_PUBLIC_QUOTE_MOCK_ADDRESS` to enable pre-connection quotes.

### Changed
- Simplified Husky hooks to use lint-staged in pre-commit and checks in pre-push.
- Migrated to ESLint 9 flat config and Prettier 3 config.
- Scoped Next.js ESLint dirs and minor next.config.ts tidy.
- Reduced unnecessary quote requests and improved swap percentage helpers.


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.6] - 2025-08-28

### Changed

- Refactored `useSearchWithPopular` hook to use React Query for search and popular rune flows with debounced input.
- Updated tests to wrap hook consumers with `QueryClientProvider`.

### Fixed

- useSearchWithPopular: prefer fetched popular results over `initialItems` when available; correct `isLoading`/`error` derivation; sync cache only when `initialItems` change.

## [0.2.5] - 2025-08-28

### Added

- Reusable `useRuneBalances` hook for fetching rune balances and refactored Borrow and Swap tabs to use it.
- Centralized helper for retrieving and validating Liquidium JWTs used by borrow routes.
- Centralized SatsTerminal error handler and wrapped PSBT endpoints with `withApiHandler`.
- Helper to generate rune icon URLs and refactor existing hard-coded links.
- Generic `useSearchWithPopular` hook for debounced search with optional popular-item caching.
 - Centralized `usePopularRunes` hook and refactored hooks/components to consume it.
 - Helper `fetchRuneEndpoint` for Ordiscan rune endpoints with accompanying tests.

### Changed

- Centralized rune route validation with shared helper.
- Refactored `FormattedRuneName` to use the `useRuneInfo` hook.
- `useAssetSearch` and `useRunesSearch` now leverage `useSearchWithPopular`.
- Replace console statements with logger utilities.
- Made `useFeeRates` accept optional React Query config and reused it in swap execution.
- Refactored popular rune mapping into a generic utility.
- Consolidated rune data fetching hooks with new `useRuneDataQuery` wrapper.
- Updated changelog workflow to automatically trigger @claude when changelog validation fails, enabling automated changelog generation.
- Enhanced Claude workflow permissions to allow contents and pull-requests write access for committing changelog updates.

## [0.2.3] - 2025-08-24

### Added

- Changelog page at `/changelog` that renders CHANGELOG content without the preamble and link reference block (shows only versions, dates, and changes).
- Footer "Changelog" button next to "Docs" for quick access.

## [0.2.2] - 2025-08-23

### Added

- CI: Auto-create/update GitHub Releases from the top CHANGELOG section on merges to `main`.
- CI: PR validation to ensure CHANGELOG top version matches `package.json` and is not `[Unreleased]`.

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
[0.2.4]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ropl-btc/RunesSwap.app/releases/tag/v0.1.0
[0.2.5]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.2.4...v0.2.5
[0.2.6]: https://github.com/ropl-btc/RunesSwap.app/compare/v0.2.5...v0.2.6
