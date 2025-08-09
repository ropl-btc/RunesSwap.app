### 1) Consolidate Liquidium types into `src/types/liquidium.ts`

- **Why**: Borrow- and repay-related interfaces live inside
  `src/lib/api/liquidium.ts` alongside fetch logic, while other Liquidium
  types are in `src/types/liquidium.ts`. Splitting types across modules makes
  reuse harder and increases drift.
- **Action**:
  - Move response/request interfaces (borrow/prepare/submit/range) from
    `src/lib/api/liquidium.ts` into `src/types/liquidium.ts`.
  - Update imports in modules that use these types.
- **Impact**: Centralized type definitions, clearer API client files, fewer
  inline type blocks.

  [Done]

### Simplifications to keep the codebase lean

- **Drop redundant re-export layer**
  - `src/lib/apiClient.ts` only re-exports `./api` and has no usages in app code.
  - Replace any stray imports of `@/lib/apiClient` with `@/lib/api` and delete
    `src/lib/apiClient.ts` (and its test if present).
  - **Impact**: fewer indirection layers, clearer imports.

  [Done]

- **Consolidate popular runes cache helpers**
  - `src/lib/popularRunesCache.ts` exposes both
    `getCachedPopularRunesWithMetadata` and
    `getCachedPopularRunesWithExpiry`, plus a simple `getCachedPopularRunes`.
  - Merge the first two into a single
    `getCachedPopularRunes()` that returns data along with minimal flags
    (e.g., `isExpired`, `isStale`, `lastRefreshAttempt`). Keep the SWR-style
    background refresh logic inside
    `src/app/api/cached-popular-runes/route.ts`.
  - **Impact**: slimmer API surface, less duplication, same behavior.

  [Done]

- **Unify fee selectors into one configurable component**
  - `src/components/FeeSelector.tsx` and `src/components/SwapFeeSelector.tsx`
    duplicate nearly the same UI/logic with slightly different options.
  - Create a single `FeeSelector` that accepts a prop for available options
    (e.g., `['slow','medium','fast','custom']` vs `['medium','fast','custom']`),
    remove `SwapFeeSelector.tsx`, and update imports.
  - **Impact**: less duplication, one place to fix validation/UX.

  [Done]

- **Remove unused formatter**
  - `formatNumber` in `src/utils/formatters.ts` isn’t referenced.
  - Delete it to keep utilities minimal. Keep `truncateTxid` and
    `formatNumberString` which are used.
  - **Impact**: smaller utility surface, no behavior change.

  [Done]

- **Simplify rune-info-by-id route**
  - `src/app/api/ordiscan/rune-info-by-id/route.ts` performs a second fallback
    that fetches up to 1000 runes from DB and attempts an Ordiscan refresh.
  - Since the route already does exact and prefix DB lookups, drop the heavy
    fallback and return 404 when not found (or keep a single light DB query).
  - **Impact**: leaner route, fewer DB reads/external calls, same UX for valid
    IDs.

  [Done]

### Simplify plan (keep behavior, reduce complexity)

- **1) Consolidate API utils naming**
  - **Why**: There are two helpers: `src/lib/apiUtils.ts` (server-only, NextResponse helpers) and `src/lib/api/utils.ts` (client response handling). Similar naming can confuse usage.
  - **How**: Keep both modules but consider renaming for clarity (e.g., `apiServer.ts` and `apiClient.ts`) and add brief JSDoc about intended environment.
  - **Impact**: Clearer separation of concerns without risky merges.

  [Validated: Keep as-is functionally; consider naming cleanup only.]

- **3) Unify rune/asset search logic**
  - **Why**: `useRunesSearch` and `useAssetSearch` duplicate debouncing, error/loading state, and mapping. `useRunesSearch` also repeats “inject Liquidium token” logic.
  - **How**: Extract shared search into a single hook or helper (e.g., `useSearchRunes(query)` + `mapRuneToAsset`). Let `useAssetSearch` consume that helper instead of re-implementing. Factor the Liquidium token injection/filter into a single small function reused by both code paths.
  - **Impact**: Less code, fewer edge cases, consistent UX for searching and popular lists.

  [Validated: Legit. `useRunesSearch` and `useAssetSearch` duplicate debounce, states, and mapping. Can share a common helper or hook.]

These changes are safe, reduce duplication, and do not alter user-visible behavior.



### Additional simplifications

- **Deduplicate CoinGecko price fetch**
  - [Done] `src/hooks/useBtcPrice.ts` now consumes `getBtcPrice` from `@/lib/api/coingecko`.

- **Centralize fetch/JSON error handling**
  - Many `src/lib/api/*.ts` functions repeat: `fetch → response.ok check →
    try/catch JSON → map error message`. Add a tiny `fetchJson(url, init)`
    helper in `@/lib/api/utils` that performs parse and standardizes error
    shape, then replace repeated blocks in `liquidium.ts` and others.
  - **Impact**: smaller functions, consistent error messages, fewer edge cases.
