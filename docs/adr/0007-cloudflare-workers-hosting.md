# ADR 0007: Host on Cloudflare Workers, with a preview per pull request

- **Status:** accepted, 2026-10-13
- **Amends:** `docs/specs/2026-10-10-naf-explorer-design.md` §12 ("deployed manually to GitHub Pages; no CI/CD until an ADR adds it")

## Context

The spec planned a manual deploy to GitHub Pages and no CI/CD. In practice the explainer is served from a Cloudflare Worker connected to the GitHub repository, and pull-request previews failed until the repository had a Wrangler configuration with a `previews` block.

## Decision

- The built `dist/` is served as a static-assets-only Cloudflare Worker named `naf-explorer`, configured in `wrangler.jsonc` (`assets.directory: ./dist`, no Worker script).
- Cloudflare Workers Builds builds (`npm run build`) and deploys `main` on every push, and runs `npx wrangler preview` for each pull request, posting the preview URL on it. The empty `previews` block means previews use the production settings.
- The live site is https://naf-explorer.brian-1e1.workers.dev until a custom domain replaces it.

## Consequences

- The build and deploy settings live partly in the Cloudflare dashboard (build command) and partly in `wrangler.jsonc` (what is served).
- `npm run verify` is still run locally before committing; Workers Builds does not run the tests.
