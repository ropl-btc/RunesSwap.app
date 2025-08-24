# Rollup PR Plan and Status

This document captures exactly what has been done to combine all open small refactor PRs into a single rollup branch and what remains to finish the process. It’s designed so we can resume seamlessly with the same context.

## Branch
- Name: `chore/rollup-open-refactors`
- Base: `main`

## Scope (Included PRs)
- #138: feat: add reusable rune balances hook (draft)
- #137: feat: centralize Liquidium auth (draft)
- #136: refactor: centralize rune route validation (draft)
- #135: feat: centralize sats terminal errors
- #134: refactor: use useRuneInfo hook in FormattedRuneName
- #133: feat: centralize rune icon URL generation
- #132: refactor: replace console logs with logger utilities (draft)
- #131: feat: add generic search hook (draft)
- #130: refactor: reuse fee rate hook (draft)
- #129: refactor(utils): add generic popular items mapper (draft)
- #128: feat: centralize popular runes fetching (draft)
- #127: feat(api): add fetchRuneEndpoint helper (draft)
- #126: feat: consolidate rune data fetching hooks (draft)

## What’s Done
- Created rollup branch from `main`: `chore/rollup-open-refactors`.
- Sequentially merged all open PR heads (#126–#138), resolving conflicts.
- Repeated CHANGELOG conflicts consolidated under `## [Unreleased]` with all items preserved and grouped into Added/Changed.
- Adopted/standardized implementations while resolving overlaps:
  - Ordiscan API routes now use `createRuneRoute(...)` helper:
    - `src/app/api/ordiscan/rune-info/route.ts`
    - `src/app/api/ordiscan/rune-market/route.ts`
  - `src/app/api/ordiscan/helpers.ts`: switched warning logs to `logger.warn`.
  - `src/hooks/useRunesSearch.ts`: chose the `useSearchWithPopular` approach; integrated with `usePopularRunes` where intended by PRs.
  - Ensured new helpers/hooks from included PRs are wired consistently: `useSearchWithPopular`, `usePopularRunes`, `fetchRuneEndpoint`, `logger`.
- Local validation:
  - `pnpm lint` passes.
  - `pnpm build` succeeds (Next.js 15 output recorded).
- Auth-locked steps were not executed (push/PR creation) due to invalid GitHub token in the session.

## Files Most Touched During Conflict Resolution
- `CHANGELOG.md` (merged all Unreleased entries; removed conflict markers)
- `src/app/api/ordiscan/helpers.ts` (use `logger.warn`)
- `src/app/api/ordiscan/rune-info/route.ts` (use `createRuneRoute`)
- `src/app/api/ordiscan/rune-market/route.ts` (use `createRuneRoute`)
- `src/hooks/useRunesSearch.ts` (kept `useSearchWithPopular` resolution)

## Ready-to-Use PR Body
- Saved at: `.github/ROLLUP_PR_BODY.md`

## What’s Left (Use Github MCP instead of github cli tools)
1) Authenticate and push branch
- `gh auth login -h github.com`  # ensure repo scope
- `git checkout chore/rollup-open-refactors`
- `git push -u origin chore/rollup-open-refactors`

2) Create the "master" rollup PR 
- `gh pr create --base main --head chore/rollup-open-refactors --title "Rollup: merge 13 refactor PRs (drafts included)" --body-file .github/ROLLUP_PR_BODY.md`
- Optional: `gh pr edit --add-label "refactor","rollup"`

3) Wait ~5 minutes for Claude bot review, then process feedback
- Open the new PR, read Claude’s review comments.
- Validate each suggestion (ignore hallucinated items).
- Apply legitimate fixes directly on `chore/rollup-open-refactors` and push.
- Keep CHANGELOG’s Unreleased section updated if changes are noteworthy.

4) Close superseded small PRs (after rollup PR exists)
- Replace `<MASTER_NUM>` with the rollup PR number:
```
for N in 138 137 136 135 134 133 132 131 130 129 128 127 126; do \
  gh pr close $N --comment "Superseded by #<MASTER_NUM> (rollup of refactor PRs)."; \
done
```

## Additional Optional Steps
- Request reviewers as needed: `gh pr edit --add-reviewer <handles>`
- Monitor CI (lint, type-check, tests, build) on the rollup PR.

## Notes
- We intentionally minimized SatsTerminal/API calls; no new endpoints were added beyond the refactors.
- Numeric precision and API client patterns follow `CLAUDE.md` guidance.
- If further conflicts surface from late PR changes, re-run merge for the new PR(s) or rebase the rollup branch.
