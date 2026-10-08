# Hamburger Drawer + Multi-Page Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `public/index.html` into 8 static pages with a shared slide-in hamburger drawer, built at build time.

**Architecture:** Build-time templates in `src/templates/` assembled by `scripts/build-pages.mjs` into `public/*.html`; shared drawer markup/CSS/JS; existing `public/script.js` initializers guarded per page.

**Tech Stack:** Static HTML, Tailwind CSS v4 CLI, vanilla JS (no framework), Node 22+ build script, Capacitor webDir `public/`.

**Spec:** `docs/superpowers/specs/2026-10-08-hamburger-drawer-multipage-design.md`

## Global Constraints

- Output stays static files in `public/`; no framework or SPA router.
- All asset and page links are relative (`images/...`, `style.css`, `js/...`, `./about.html`) — never leading `/` — so Capacitor `file://` and `https://www.tineghir.ma/<page>.html` both resolve.
- Build order: `npm run pages` → Tailwind `src/input.css` → `public/style.css` → `npx cap sync android`.
- Section content moves verbatim; only nav links (`#about` → `./about.html`), head tags, and footer change.
- Keep `public/script.js` exported init names stable (`initScrollAnimations`, `initLightbox`, `initMap`, `initShareButtons`, `initNavigateButtons`, `initSortControl`, `initBackButton`).
- Map (`#map`) renders only on `index.html` + `visit.html`.
- `prefers-reduced-motion` disables drawer slide and reveal transitions.

## Review Focus

- Drawer traps Tab focus while open and returns focus to `#mobile-menu-btn` on close — keyboard-only user expects no focus escape to the page behind.
- No leftover `href="#about"`-style cross-section anchors in generated pages — a visitor clicking About on `visit.html` expects a page load, not a dead anchor.
- Every generated page contains exactly one `<nav>`, one drawer `<aside id="site-drawer">`, and no unreplaced `{{...}}` slot — a template typo must fail the build, not ship blank nav.
- Tailwind output still contains drawer classes (`site-drawer`, `drawer-open`) — a purge/glob mistake must not silently unstyle the drawer.
- Android back button with empty history exits the app instead of hanging on a dead page — Capacitor tester expects drawer → history → exit order.

---
### Task 1: Templates + build script + page generation

**Files:**
- Create: `src/templates/base.html`
- Create: `src/templates/nav.html` (placeholder drawer mount — full drawer markup lands in Task 2; this task needs the include to exist)
- Create: `src/templates/footer.html`
- Create: `src/templates/pages/index.html`, `about.html`, `attractions.html`, `gallery.html`, `itineraries.html`, `guide.html`, `practical.html`, `visit.html`
- Create: `src/templates/pages.meta.json`
- Create: `scripts/build-pages.mjs`
- Create: `scripts/check-pages.mjs`
- Modify: `package.json` (add `pages` + `check:pages`, chain `pages` into `build`, `cap:sync`, `android:*`)

**Interfaces:**
- Consumes: current `public/index.html` sections (lines ~190-1148), footer (~1150-1203).
- Produces: `buildPages(rootDir: string) -> string[]` (writes 8 files to `public/`, returns written paths); `PAGES_META: Record<page, {title, description, canonical, showMap: boolean, leaflet: boolean, activeNav: string}>`; `npm run pages`, `npm run check:pages` commands used by Tasks 2-4.

- [ ] **Step 1: Write failing check `scripts/check-pages.mjs`**

```js
// Asserts: 8 files exist in public/, no "{{" leftovers, no href="#about|#attractions|#gallery|#guide|#practical|#visit|#home" cross-anchors,
// drawer aside present, map div only on index+visit.
import { strict as assert } from 'node:assert';
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node scripts/check-pages.mjs`
Expected: FAIL (non-zero exit, missing `public/about.html` etc.)

- [ ] **Step 3: Extract `src/templates/pages/*.html` fragments from `public/index.html`**

Move sections verbatim per spec page map; rewrite in-fragment nav CTAs (`href="#attractions"` → `./attractions.html`, `href="#visit"` → `./visit.html`, `href="#about"` → `./about.html`); leave lightbox modal markup in place for now (Task 3 moves it to gallery only).

- [ ] **Step 4: Implement `src/templates/base.html`, `nav.html`, `footer.html`, `pages.meta.json`**

`base.html` slots: `{{title}} {{description}} {{canonical}} {{nav}} {{content}} {{footer}}` plus shared head (fonts, favicon, theme-color) and `{{#if leaflet}}` Leaflet CSS/JS includes; `footer.html` `{{#if showMap}}<div id="map">` (keep simple `<!--IF:showMap-->` markers if no templating lib — raw string replace only, no new dependency); `pages.meta.json` with unique title/description/canonical per page, `showMap/leaflet: true` only for index + visit.

- [ ] **Step 5: Implement `scripts/build-pages.mjs` with `buildPages(rootDir)`**

Raw `readFileSync` + string replace (same style as `scripts/fetch-tiles.mjs`); fail fast on missing slot/fragment; validate every `./*.html` href target exists; write `public/<page>.html`.

- [ ] **Step 6: Wire `package.json` scripts**

`pages`: `node scripts/build-pages.mjs`; `check:pages`: `node scripts/check-pages.mjs`; `build`: `npm run pages && tailwindcss -i ./src/input.css -o ./public/style.css`; prepend `npm run pages &&` to `cap:sync`, `android:sync`, `android:build-debug`, `android:build-debug-win`, `android:build-release`, `android:build-release-win`.

- [ ] **Step 7: Run generation + check to verify pass**

Run: `npm run pages; node scripts/check-pages.mjs`
Expected: PASS (8 files, no leftovers; map div only in `public/index.html`, `public/visit.html`)

- [ ] **Step 8: Commit**

```bash
git add src/templates scripts/build-pages.mjs scripts/check-pages.mjs package.json public/*.html
git commit -m "feat: split single page into 8 build-time template pages"
```

### Task 2: Slide-in drawer markup, style, and behavior

**Files:**
- Modify: `src/templates/nav.html`
- Modify: `src/input.css`
- Create: `public/js/drawer.js`
- Modify: `src/templates/base.html` (include `js/drawer.js` with `defer`)
- Test: extend `scripts/check-pages.mjs` (drawer assertions already stubbed in Task 1 — tighten here)

**Interfaces:**
- Consumes: `npm run pages` pipeline from Task 1.
- Produces: `#mobile-menu-btn[aria-expanded][aria-controls="site-drawer"]`, `#site-drawer[role="dialog"][aria-modal="true"]`, `#drawer-backdrop`, `openDrawer()/closeDrawer()` in `public/js/drawer.js`, `body.drawer-open` scroll lock, pathname active link (`.nav-active`).

- [ ] **Step 1: Write failing drawer behavior assertions**

```js
// check-pages additions: every page has #mobile-menu-btn with aria-controls="site-drawer",
// #site-drawer role=dialog, #drawer-backdrop; public/js/drawer.js defines openDrawer/closeDrawer,
// traps Tab (contains 'focus' trap handler), sets nav-active by pathname (contains 'location.pathname').
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node scripts/check-pages.mjs`
Expected: FAIL (placeholder nav lacks drawer aside)

- [ ] **Step 3: Implement drawer markup in `src/templates/nav.html`**

Keep logo SVG + desktop `md:flex` row with `./*.html` links; hamburger button animates 3 bars → X via `aria-expanded` (two spans, CSS transform); `<div id="drawer-backdrop" hidden>` + `<aside id="site-drawer" role="dialog" aria-modal="true" aria-label="Site menu">` listing all 8 pages with `data-page`, CTA, close button; `44px` min touch targets.

- [ ] **Step 4: Implement drawer CSS in `src/input.css`, remove old `#mobile-menu` rules**

`#site-drawer { transform: translateX(100%); transition: transform .3s ease; } body.drawer-open #site-drawer { transform: none; }` + backdrop fade + `body.drawer-open { overflow: hidden; }`; extend existing `prefers-reduced-motion` block to instant-show drawer; delete `src/input.css:131-141` `#mobile-menu` max-height rules.

- [ ] **Step 5: Implement `public/js/drawer.js` (`openDrawer/closeDrawer`)**

Null-safe (`if (!btn || !drawer) return`); toggles `body.drawer-open`, `hidden` on backdrop, `aria-expanded/label`; backdrop click + `Escape` close; Tab focus trap inside drawer; return focus to button; mark active link matching `location.pathname` with `.nav-active` (keep `.nav-active` rule in `input.css:34-36`).

- [ ] **Step 6: Regenerate + verify pass**

Run: `npm run pages; node scripts/check-pages.mjs; npm run build`
Expected: PASS; `public/style.css` contains `site-drawer` and `drawer-open`

- [ ] **Step 7: Commit**

```bash
git add src/templates/nav.html src/templates/base.html src/input.css public/js/drawer.js scripts/check-pages.mjs public/style.css public/*.html
git commit -m "feat: add slide-in hamburger drawer with focus trap"
```

### Task 3: Guard per-page JS, relocate lightbox, rewrite back button

**Files:**
- Modify: `public/script.js`
- Modify: `src/templates/pages/gallery.html` (lightbox modal markup lives here only)
- Modify: `src/templates/base.html` (include `script.js` with `defer` on all pages)
- Test: `scripts/check-pages.mjs` additions + `node --check public/script.js`

**Interfaces:**
- Consumes: `#site-drawer` from Task 2; `#map` only on index + visit.
- Produces: guarded inits (no-throw on pages missing their mount); lightbox only on gallery; Capacitor back order drawer → history → exit.

- [ ] **Step 1: Write failing assertions**

```js
// check-pages: lightbox #lightbox exists only in public/gallery.html;
// public/script.js contains 'getElementById(\'map\')' guard returning early,
// 'querySelectorAll(\'.lightbox-trigger\')' length guard, '#attractions-grid' guard,
// and back-button handler with 'exitApp' but no 'hashEntries' counting.
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node scripts/check-pages.mjs`
Expected: FAIL (lightbox still global, scrollspy + hashEntries still present)

- [ ] **Step 3: Move lightbox modal markup to `gallery.html` fragment only**

Cut `#lightbox` block (current index end ~1205-1229) from shared base/footer into `src/templates/pages/gallery.html`.

- [ ] **Step 4: Guard initializers in `public/script.js`**

Early-return when mount missing: `initLightbox` (no `.lightbox-trigger`), `initMap` (no `#map` — keep existing early return, extend to skip `initBaseLayers`), `initShareButtons/initNavigateButtons/initSortControl` (no `#attractions-grid`); delete `initScrollspy` and its `DOMContentLoaded` call; keep function names.

- [ ] **Step 5: Rewrite `initBackButton` (drawer → history → exit)**

Remove `hashEntries/skipNextHash` counting; handler: if drawer open → `closeDrawer`; else if `history.length > 1` → `history.back()`; else `App.exitApp()`; native-only guard unchanged.

- [ ] **Step 6: Verify**

Run: `node --check public/script.js; npm run pages; node scripts/check-pages.mjs`
Expected: PASS, exit 0 on syntax check

- [ ] **Step 7: Commit**

```bash
git add public/script.js src/templates/pages/gallery.html src/templates/base.html public/*.html
git commit -m "feat: guard per-page initializers and rewrite back-button flow"
```

### Task 4: SEO, Tailwind globs, and final verification

**Files:**
- Modify: `tailwind.config.js`
- Modify: `public/sitemap.xml`
- Modify: `src/templates/base.html` (per-page title/meta/canonical/OG/JSON-LD wiring — verify placeholders resolve)
- Test: `scripts/check-pages.mjs` (meta + sitemap assertions)

**Interfaces:**
- Consumes: all Tasks 1-3 output.
- Produces: shippable `public/` with 8 indexed pages, working drawer offline, green checks.

- [ ] **Step 1: Write failing meta assertions**

```js
// check-pages: each page has unique <title>, meta[name=description], link[rel=canonical]
// matching pages.meta.json, og:url identical to canonical; sitemap.xml lists 8 <loc>s;
// style.css contains '.nav-active' and 'site-drawer'.
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node scripts/check-pages.mjs`
Expected: FAIL (sitemap has 1 URL, titles duplicated)

- [ ] **Step 3: Implement per-page head in build script + `sitemap.xml` with 8 URLs**

Render title/description/canonical/OG/Twitter + JSON-LD `url` from `pages.meta.json`; `lastmod 2026-10-08`; keep `robots.txt` sitemap line unchanged.

- [ ] **Step 4: Fix `tailwind.config.js` content globs**

Replace `["./public/index.html", "./public/script.js"]` with `["./src/templates/**/*.html", "./public/js/*.js", "./public/script.js"]` so drawer/nav classes survive; rebuild.

- [ ] **Step 5: Full verification pass**

Run: `npm run pages; npm run build; node scripts/check-pages.mjs`
Expected: PASS all; manual spot-checks: 390px drawer open/close/backdrop/ESC/Tab-trap/scroll-lock per page, desktop row visible + button hidden, attractions sort/share/directions mount, gallery lightbox, index + visit map online + offline banner path, other pages console-clean, `npx cap sync android` exit 0.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.js public/sitemap.xml scripts/build-pages.mjs scripts/check-pages.mjs src/templates public/style.css public/*.html
git commit -m "feat: per-page SEO meta, sitemap, and tailwind content globs"
```
