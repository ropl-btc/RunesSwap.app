# Cloudflare migration

## Runtime

- Worker: `runesswap`, account `Robin` (`81b27ab7c6fe3a3b3a0e6d31f7d2a381`).
- Existing Vercel project: `quid-labs-inc/runes-swap-exe` (`prj_MEKgEPzIZkm1ZvikGHsDPFescSs5`). Keep it until Robin verifies the migration.
- Existing public hostnames: `runesswap.app` redirects to `www.runesswap.app`.
- Run `bun run ai-check`, then deploy and verify the workers.dev URL before attaching production domains.
- `vercel.json` disables new Vercel Git deployments from this branch. Remove that temporary guard after deleting the Vercel project. Never deploy a Vercel preview or production build from the migrated branch. The existing Vercel deployment remains the rollback origin.

## DNS cutover

Cloudflare zone: `e6a9636304c6b3f1c370f8fbcdc5754b`.
Nameservers: `carlane.ns.cloudflare.com`, `quinton.ns.cloudflare.com`.
The registrar must replace `ns1.vercel-dns.com` and `ns2.vercel-dns.com` with those nameservers.

The pending Cloudflare zone initially mirrors Vercel's apex/wildcard aliases and CAA records, so nameserver activation can happen before application cutover. No MX or TXT records were present at migration inventory time.

Once the zone is active and the Worker is verified, replace the apex Vercel CNAME with a Worker custom domain, add `www.runesswap.app` as another custom domain, and record both routes in `wrangler.jsonc`. Preserve the wildcard record and CAA records. Verify TLS, redirects, all pages, static assets, and APIs through both public hostnames.

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
