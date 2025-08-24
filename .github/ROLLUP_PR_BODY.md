This rollup PR consolidates the following small refactor/feature PRs into a single review to reduce overhead and resolve minor overlaps/conflicts in one place.

Included PRs:

- #138: feat: add reusable rune balances hook — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/138)
- #137: feat: centralize Liquidium auth — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/137)
- #136: refactor: centralize rune route validation — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/136)
- #135: feat: centralize sats terminal errors — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/135)
- #134: refactor: use useRuneInfo hook in FormattedRuneName — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/134)
- #133: feat: centralize rune icon URL generation — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/133)
- #132: refactor: replace console logs with logger utilities — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/132)
- #131: feat: add generic search hook — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/131)
- #130: refactor: reuse fee rate hook — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/130)
- #129: refactor(utils): add generic popular items mapper — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/129)
- #128: feat: centralize popular runes fetching — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/128)
- #127: feat(api): add fetchRuneEndpoint helper — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/127)
- #126: feat: consolidate rune data fetching hooks — @ropl-btc (https://github.com/ropl-btc/RunesSwap.app/pull/126)

Notes:

- Resolved repeated CHANGELOG merge conflicts by consolidating all entries under [Unreleased].
- Adopted centralized helpers:
  - createRuneRoute for Ordiscan rune routes
  - satsTerminalError centralization
  - useSearchWithPopular + usePopularRunes hooks
  - fetchRuneEndpoint helper
  - logger utilities replacing console.*
- Build and lint pass locally (pnpm build, lint).
- Please review conflict resolutions in: src/app/api/ordiscan/helpers.ts, rune-info/route.ts, rune-market/route.ts, and hooks using useSearchWithPopular.
