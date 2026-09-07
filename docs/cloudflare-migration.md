# Cloudflare migration

## Runtime

- Worker: `runesswap`, account `Robin` (`81b27ab7c6fe3a3b3a0e6d31f7d2a381`).
- Existing Vercel project: `quid-labs-inc/runes-swap-exe` (`prj_MEKgEPzIZkm1ZvikGHsDPFescSs5`). Keep it until Robin verifies the migration.
- Existing public hostnames: `runesswap.app` redirects to `www.runesswap.app`.
- Run `bun run ai-check`, then deploy and verify the workers.dev URL before attaching production domains.
- Cloudflare Web Analytics replaces Vercel Analytics. Site ID: `d5422c3e655f400a811b7c5bb18f1d5a`. The public beacon token is embedded in the production document; SPA tracking is enabled by default. Automatic injection is disabled to avoid duplicate beacons. Verify collection under the production hostname after cutover.
- `vercel.json` disables new Vercel Git deployments from this branch. Remove that temporary guard after deleting the Vercel project. Never deploy a Vercel preview or production build from the migrated branch. The existing Vercel deployment remains the rollback origin.

## DNS cutover

Cloudflare zone: `e6a9636304c6b3f1c370f8fbcdc5754b`.
Nameservers: `carlane.ns.cloudflare.com`, `quinton.ns.cloudflare.com`.
Hostinger is the domain registrar. Nameservers were changed to Cloudflare on 2026-09-07, and Cloudflare activated the zone.

The zone initially mirrored Vercel's apex/wildcard aliases and CAA records to preserve service during DNS activation. No MX or TXT records were present at migration inventory time.

Both `runesswap.app` and `www.runesswap.app` are attached directly to the `runesswap` Worker and recorded in `wrangler.jsonc`. The apex Vercel CNAME was replaced; the wildcard record and CAA records remain. Native Cloudflare Workers Builds connects the repository's `main` branch to production deployments. Its build command is `bun run ai-check`, its deploy command is `bunx --no-install wrangler deploy`, and its build variables are `BUN_VERSION=1.4.2` and `NODE_VERSION=22`. The Main Build GitHub workflow validates the application separately. GitHub releases are published only after Cloudflare's successful GitHub check, using the deployed commit. Manual deployments use `bun run deploy`; both paths retain the custom domains. Verify TLS, redirects, pages, static assets, and APIs after deployments.

## Rollback

Keep the Vercel project, its domain assignments, secrets, and existing production deployment.
To revert traffic, detach Worker custom domains and restore these unproxied DNS records:

| Name | Type | Target |
| --- | --- | --- |
| `runesswap.app` | CNAME | `cb5fb637a1a27286.vercel-dns-017.com` |
| `www.runesswap.app` | CNAME | `cname.vercel-dns-016.com` |
| `*.runesswap.app` | CNAME | `cname.vercel-dns-016.com` |

CAA issuers: `pki.goog`, `sectigo.com`, `letsencrypt.org` (flags 0, tag `issue`).
A registrar-level rollback can restore Vercel's original nameservers while the Vercel zone remains intact.

## Verification boundaries

Automated checks can exercise validation, quotes, market data, routing, wallet menus, and mocked signing flows. Actual wallet signatures, swaps, borrowing, and repayment require Robin's final verification. Do not delete Vercel until that verification is complete.

## Releases

Feature PRs add notes under `Unreleased`. A release PR moves shipped notes into a dated version section and updates `package.json` to match. Keep an empty `Unreleased` section for subsequent work. The public changelog shows only dated releases. The changelog gate accepts either a new unreleased bullet or a new dated version section containing a nonempty bullet and matching an increased package version.

Cloudflare manages deployment authentication through its native Git integration; no Cloudflare GitHub secret or account variable is required. Runtime service secrets stay on the Worker. Do not add them to GitHub or the build environment.
