# ADR-0001 — Project onboarding baseline

Date: 2026-07-18
Status: Accepted

## Context
The repository (`github.com/NJUPT-LY/blog`) was initialized from the Cloudflare Astro blog starter and already carries customizations beyond the starter: a `BlogCalendar` sidebar, a `?year=` archive filter, a new `C-01.mdx` post, and Chinese comments. It had no project contract, no tests, no lint/format config, and a placeholder `site` URL. Onboarding established the long-term project discipline.

## Decisions
1. **Production domain** is `https://blog.liu-ye.workers.dev`; `astro.config.mjs` `site` must be set to it before deploy (currently placeholder).
2. **Git workflow**: branch-per-task + Conventional Commits; working tree kept clean before finishing a session.
3. **Page language**: `html lang` shall be `zh-CN` (currently `en`).
4. **BlogCalendar sidebar + `?year=` filter** are permanent product features and must not be removed or broken.
5. **Tooling scope**: keep the repo without a test/lint/formatter framework for now; verification is `npm run check` (build + tsc + wrangler dry-run).

## Consequences
- Adding a post or editing a component is safe as long as the content schema and URL structure are preserved.
- Deploy correctness depends on keeping `site` in sync with the real domain.
- The Cloudflare adapter/session configuration remains a flagged anomaly to revisit (see project-contract Known Failure Modes).
