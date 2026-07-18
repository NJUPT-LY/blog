# Contract validation cases

These cases validate `docs/project-contract.md`. They are lightweight manual/automated
checks an agent can run to confirm the contract still holds. This repo has no test
framework, so these are executable checks + assertions, not `*.test.*` files.

## Build & type safety
- [ ] `npm run build` exits 0.
- [ ] `npx tsc --noEmit` exits 0.
- [ ] `npm run check` exits 0 (requires `wrangler` + network).

## Content schema (compatibility)
- [ ] Every file in `src/content/blog/**` has `title` (string), `description` (string), `pubDate` (date).
- [ ] Build fails if any required frontmatter field is missing (negative test).

## Site identity (SEO correctness)
- [ ] `astro.config.mjs` `site` equals `https://blog.liu-ye.workers.dev`.
- [ ] Generated `dist/sitemap-index.xml` and `dist/rss.xml` contain the real domain, not `example.com`.

## Language
- [ ] `src/pages/**` render `<html lang="zh-CN">`.

## Permanent features (do not break)
- [ ] `/blog` renders the `BlogCalendar` sidebar component.
- [ ] `/blog?year=2026` (or any year) filters the post list by `pubDate` year.

## URL structure (compatibility)
- [ ] A post `src/content/blog/foo.md` is reachable at `/blog/foo/`.
- [ ] Renaming a post file changes its URL (documented, not a bug).
