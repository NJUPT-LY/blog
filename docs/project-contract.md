# Project Contract — blog (NJUPT-LY personal blog)

Last updated: 2026-07-18
Owner: NJUPT-LY (刘烨)

## Goals
- A personal blog built with Astro 5, authored in Markdown/MDX, styled primarily with hand-written CSS, and deployed as a static site to Cloudflare Workers.
- Maintained as a disciplined long-term project: predictable builds, documented conventions, no silent breakage when content is added.

## Non-Goals
- No backend, runtime API, database, or server-side dynamic rendering beyond what static prerendering provides.
- No runtime image-processing service required at request time (build-time only).

## Outcome the user actually cares about
- A reliable, SEO-correct blog that **builds and deploys cleanly**, where adding or editing a post never breaks the site, and canonical/sitemap/RSS point at the real domain.

## Terminology
- **post**: a Markdown/MDX file in `src/content/blog/`; rendered at `/blog/<id>/`.
- **slug / id**: the post filename (without extension) — also the URL path segment. Changing a filename changes the public URL.
- **collection**: the Astro content collection named `blog` (schema in `src/content.config.ts`).
- **site URL**: the canonical base URL in `astro.config.mjs` `site`; drives canonical links, sitemap, and RSS.
- **worker / deploy**: the Cloudflare Worker serving static assets from `./dist` (config in `wrangler.json`).

## Architecture Boundaries
- **Content layer** (`src/content/blog/` + `src/content.config.ts`): only post files and the frontmatter schema. No logic, no components.
- **Pages** (`src/pages/`): file-based routing — `index.astro`, `about.astro`, `blog/index.astro`, `blog/[...slug].astro`. Blog posts rendered via `getStaticPaths()` + `getCollection('blog')` + `render()`.
- **Layouts** (`src/layouts/BlogPost.astro`): post page chrome only.
- **Components** (`src/components/`): `BaseHead` (SEO), `Header`, `Footer`, `HeaderLink`, `FormattedDate`, `BlogCalendar` (custom). Presentational; must not introduce runtime/backend dependencies.
- **Styles** (`src/styles/global.css`): hand-written CSS (Bear Blog base). Tailwind v4 packages and the `@tailwindcss/vite` plugin are present in `astro.config.mjs`, but `global.css` does **not** import `"tailwindcss"` and no utility classes are used — Tailwind is installed but **not currently in actual use**. **No `tailwind.config.js`.**
- **Config**: `astro.config.mjs` (integrations, adapter, `site`), `wrangler.json` (Cloudflare deploy target), `src/consts.ts` (`SITE_TITLE`, `SITE_DESCRIPTION`).
- **Build → `dist/` (gitignored) → Cloudflare Workers static assets.** `wrangler.json` `main` = `./dist/_worker.js/index.js`, `assets.directory` = `./dist`; rely on a successful `astro build` first.

## Allowed Changes
- Add / edit / remove posts in `src/content/blog/`, preserving the schema.
- Tweak components and styles within the existing structure.
- Update `SITE_TITLE` / `SITE_DESCRIPTION` in `src/consts.ts`.
- Extend the content schema **only by adding optional fields** (existing required fields stay required).

## Prohibited Changes
- Change the `site` URL away from a valid absolute URL, or break canonical/sitemap/RSS generation (must be `https://blog.liu-ye.workers.dev`).
- Change blog post URL structure (`slug` = filename) — breaks existing links and SEO.
- Remove or break the **BlogCalendar sidebar** or the **`?year=` year filter** on `/blog` (permanent features, confirmed 2026-07-18).
- Remove required frontmatter fields (`title`, `description`, `pubDate`) from the schema.
- Changing the Cloudflare adapter or `wrangler.json` `main`/`assets` paths is only allowed when explicitly investigating or resolving a documented issue (the adapter "unnecessary" warning, the `SESSION` KV binding, or deploy configuration). Before any such change: state the reason and impact. After the change: re-run the full build (`npm run build`) and the relevant deploy-config validation. Do not modify these configs as a side-effect of unrelated tasks.
- Introduce a runtime backend/SSR that changes the static deploy model.
- Rename public pages (`index`, `about`, `blog`).

## Code Conventions
- Astro + TypeScript, strict mode (`extends: astro/tsconfigs/strict`).
- Tailwind v4 is installed and the `@tailwindcss/vite` plugin is registered, but it is **not currently used** in `global.css` or components; do **not** add a `tailwind.config.js`.
- Comments may be Chinese (the codebase uses Chinese comments).
- **Git workflow (confirmed 2026-07-18)**: branch-per-task + **Conventional Commits**; keep the working tree clean before finishing a session; never commit secrets (`.env`, `.dev.vars` are gitignored).
- **Must run before considering work done**: `npm run check`. Offline fallback: `npm run build` + `npx tsc --noEmit`.
- No test / lint / formatter framework is configured; do not invent `npm run lint` / `npm test`.

## Acceptance Criteria
- `npm run check` exits 0 (build + typecheck + `wrangler deploy --dry-run` all pass).
- New/edited posts satisfy the content schema (build must not fail on frontmatter).
- Canonical URLs, sitemap, and RSS use the real site URL `https://blog.liu-ye.workers.dev`.
- Page `html lang` is `zh-CN`.
- The BlogCalendar sidebar and `?year=` filter are present and functional on `/blog`.

## Current Baseline Gaps

*This section records the project's current state as of onboarding and MUST be updated as the project progresses. It is not a permanent rule.*
- (resolved 2026-07-18) `site` is now `https://blog.liu-ye.workers.dev` and pages render `lang="zh-CN"`; no outstanding baseline gaps remain.

## Verification Commands (MUST run)
- `npm run check` — full gate: `astro build && tsc && wrangler deploy --dry-run` (confirmed from `package.json`); needs `wrangler` CLI + network.
- `npm run build` — production build to `./dist`.
- `npm run dev` — local preview at `http://localhost:4321`.
- (No unit-test / lint / format commands exist in this repo.)
- Type-checking is performed by the `tsc` step inside `npm run check` (`base.json` already sets `noEmit: true`, so it emits nothing). `npx tsc --noEmit` is an **offline equivalent** of that same step — it does **not** type-check `.astro` component bodies (use `astro check` for that) and is **not** a separate mandatory gate. Offline fallback: `npm run build` + `npx tsc --noEmit`.

## Positive Examples
- Adding a post: create `src/content/blog/my-post.md` with `title`, `description`, `pubDate` frontmatter.
- Good commit: `feat(blog): add year filter to archive`.

## Negative Examples
- Adding a `tailwind.config.js` — Tailwind v4 (if enabled) uses the Vite plugin, not a config file; and Tailwind is not currently wired into `global.css`.
- Hardcoding the domain in multiple files — keep it only in `astro.config.mjs` `site`.
- Deleting `BlogCalendar.astro` or the `?year=` handling in `src/pages/blog/index.astro`.

## Known Failure Modes
- **`site` left as `example.com`** → canonical/sitemap/RSS point at the wrong domain (SEO break). *Guard:* set `site` to `https://blog.liu-ye.workers.dev` before any deploy.
- **Cloudflare adapter flagged "unnecessary" for a static site** + `SESSION` KV binding warning at build → adapter/sessions may be misconfigured. *Guard:* verify `wrangler.json` matches deploy needs; document if sessions are intentionally unused.
- **Missing frontmatter** (`title`/`description`/`pubDate`) → `npm run build` fails. *Guard:* schema is enforced at build time.
- **`npm run check` fails offline** (needs `wrangler` + network). *Guard:* fall back to `npm run build` + `npx tsc --noEmit`.
- **Uncommitted working tree** → risk of lost work. *Guard:* branch + commit discipline.

## Precedence (when rules conflict)
1. User's explicit current instruction
2. This contract
3. Project `AGENTS.md`
4. Global `AGENTS.md`
5. General best practice

## Confirmed Facts (not assumptions)
- Real production domain: **`https://blog.liu-ye.workers.dev`**.
- Git: branch-per-task + Conventional Commits; remote `origin` = `github.com/NJUPT-LY/blog.git`, default branch `main`.
- Page language must be **`zh-CN`** (currently `en` — gap to fix).
- BlogCalendar sidebar + `?year=` filter are **permanent features**.
- No test / lint / formatter tooling is configured.
- As of onboarding, the working tree is **not clean** (6 modified + 8 untracked files, including a new `C-01.mdx` post and `BlogCalendar.astro`).

## Unresolved Assumptions (verify before relying on them)
- Whether Cloudflare **sessions / `SESSION` KV binding** are intentionally used or are dead config (build warns the adapter is unnecessary for a static site).
- Whether **sharp image optimization** should be configured (`imageService: "compile"`); currently only a build warning.
- Final **`SITE_TITLE` / `SITE_DESCRIPTION`** copy (still the generic Astro starter text).
- Whether placeholder copy in `index.astro` / `about.astro` should be replaced with real content.
- Whether the blog intentionally excludes a CMS or multi-author publishing workflow (no explicit confirmation yet; treat as undecided).
