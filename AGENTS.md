# AGENTS.md

Compact guidance for OpenCode sessions in this repo. For a fuller overview, see [CLAUDE.md](./CLAUDE.md).

## What this is

A personal blog: **Astro 5** + **MDX**, built as a static site and deployed to **Cloudflare Workers** (via the `@astrojs/cloudflare` adapter + static assets). Styling is primarily hand-written CSS (Bear Blog base); Tailwind v4 packages and the `@tailwindcss/vite` plugin are present but not currently used. There is no backend or runtime API — it is fully static.

## Commands (run from repo root)

- `npm run dev` — local dev server at `http://localhost:4321`
- `npm run build` — production build to `./dist/` (gitignored)
- `npm run preview` — `astro build` then serve locally with `wrangler dev`
- `npm run check` — **the full verification gate**: `astro build && tsc && wrangler deploy --dry-run`. Use this (not a test suite — there is none) to confirm a change is sound.
- `npm run deploy` — `wrangler deploy` to Cloudflare
- `npm run cf-typegen` — regenerate Cloudflare types (`wrangler types`) into `.astro/`

There is **no lint, formatter, or test framework configured** (no eslint/prettier config, no `*.test.*`). Do not invent `npm run lint`/`test` commands.

## High-signal gotchas

- **Content schema is enforced at build time.** Every file in `src/content/blog/**` must have `title` and `description` (both strings); `pubDate` is required and coerced from a string to a Date. Missing/!mismatched frontmatter fails `npm run build`. `updatedDate` and `heroImage` are optional. Schema lives in `src/content.config.ts:8`.
- **Styling is hand-written CSS** (Bear Blog base) in `src/styles/global.css`. Tailwind v4 packages and the `@tailwindcss/vite` plugin are present in `astro.config.mjs`, but `global.css` does **not** import `"tailwindcss"` and no utility classes are used — Tailwind is installed but **not currently in actual use**. Do not add a legacy `tailwind.config.js`.
- **`site` URL in `astro.config.mjs:12` is a placeholder (`https://example.com`).** It drives canonical URLs, sitemap, and RSS — set it to the real domain before deploying.
- **Site title/description are in `src/consts.ts`** (`SITE_TITLE`, `SITE_DESCRIPTION`), separate from the `site` URL. Both usually need updating together.
- **Blog routing:** `src/pages/blog/[...slug].astro` renders all posts via `getStaticPaths()` + `getCollection('blog')` + `render()`. The route `slug` equals the post `id` (filename), so changing a filename changes the URL.
- `wrangler.json` `main` points at `./dist/_worker.js/index.js`; `assets.directory` is `./dist`. These depend on a successful `astro build` first.

## Structure pointers

- New posts → drop MD/MDX into `src/content/blog/`.
- Page-level layout for posts → `src/layouts/BlogPost.astro`; shared UI in `src/components/` (BaseHead for SEO, Header, Footer, FormattedDate, BlogCalendar, HeaderLink).
- Static pages: `src/pages/index.astro`, `about.astro`, `blog/index.astro`.

## Notes

`npm run check` invokes `wrangler deploy --dry-run`; it requires the `wrangler` CLI (already a devDependency) and may need network access. If offline, fall back to `npm run build` + `tsc --noEmit` to validate.
