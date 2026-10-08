# Hamburger Drawer + Multi-Page Split — Design

Date: 2026-10-08
Status: Approved (Approach C, 8 pages, Itineraries separate, map on index + visit)
Source: single `public/index.html` (~1232 lines) + `public/script.js` (~699 lines) + `src/input.css`

## 1. Intent

- Recreate the hamburger menu as a right-side slide-in drawer (replace the current `#mobile-menu` max-height dropdown in `src/input.css:131-141` and toggle logic in `public/script.js:2-36`).
- Split the single-page anchor site (`#home #about #attractions #gallery #guide #practical #visit` plus untitled Itineraries and Heritage bands) into one page per section, keeping the static Tailwind + Capacitor setup.

## 2. Non-goals

- No framework (no Next/Nuxt/SPA router). Stays static files in `public/`.
- No visual redesign of sections; content moves verbatim except nav links (`#about` → `./about.html`) and per-page head tags.
- No new backend, CMS, or i18n.

## 3. Page map (8 pages, approved)

| File | Content source (current index.html) |
|---|---|
| `index.html` | Hero `#home` (~190-314) + stats bar (~316-337) + teasers linking to other pages |
| `about.html` | About `#about` (~339-457) + Heritage Story band (~459-487) |
| `attractions.html` | Attractions `#attractions` + `#attractions-grid` (~489-691) + sort/share/directions mounts |
| `gallery.html` | Gallery `#gallery` (~693-821) + lightbox modal markup |
| `itineraries.html` | Curated Trips / Itineraries (~823-880), currently untitled section |
| `guide.html` | Travel Practicalities `#guide` + Quick Answers `<details>` (~882-952) |
| `practical.html` | Numbers & Prices `#practical` with `tel:` cards (~953-1033) |
| `visit.html` | Visit `#visit` plan-trip card + `mailto:` CTA (~1034-1148) |

Map (`#map`, currently in footer ~1154-1156): render only on `index.html` + `visit.html` via footer `showMap` flag. All other pages use map-free footer variant.
Footer Explore links become page links. Header desktop row keeps 6 links + CTA; drawer lists all 8 pages.

## 4. Architecture — Approach C (build-time templates)

```
src/templates/base.html        # <head> slots + {{nav}} {{content}} {{footer}} + <script> tags
src/templates/nav.html         # header + desktop row + drawer + backdrop
src/templates/footer.html      # footer with {{#if showMap}} map div {{/if}}
src/templates/pages/*.html     # 8 content fragments (moved sections)
scripts/build-pages.mjs        # reads templates + per-page meta.json, writes public/*.html
src/templates/pages.meta.json  # title, description, canonical, showMap, activeNav per page
```

Build order: `npm run pages` → `tailwindcss -i ./src/input.css -o ./public/style.css` → `npx cap sync android`.
Update `package.json` scripts: add `"pages": "node scripts/build-pages.mjs"`, change `build` to `npm run pages && tailwindcss ...`, prepend `npm run pages` to `cap:sync android:*` chains.
Update `tailwind.config.js` content globs: `./src/templates/**/*.html`, `./public/js/*.js` (drawer + guarded script), keep `./public/*.html` generated output reference or switch to templates path so drawer/nav classes are not purged.

No runtime partials fetch: output HTML is fully inline, so offline Capacitor `file://`, no-JS, and SEO all keep working.

## 5. Components

**base.html slots:** `{{title}} {{description}} {{canonical}} {{nav}} {{content}} {{footer}}`, shared `<head>` (fonts, favicon, theme-color, OG/Twitter defaults overridden per page), Leaflet CSS/JS includes only when `leaflet: true` (index + visit + attractions if map teaser kept — decided: index + visit only).

**nav.html:** logo SVG (keep), desktop `md:flex` links to `./*.html`, `#mobile-menu-btn` with animated 3-bar → X (span transforms, `aria-expanded`, `aria-controls="site-drawer"`, `aria-label`), `<div id="drawer-backdrop">`, `<aside id="site-drawer" role="dialog" aria-modal="true" aria-label="Site menu">` with nav list (`data-page` per link), CTA, close button. `body.drawer-open { overflow: hidden }` + safe-area padding retained.

**drawer.js (`public/js/drawer.js`):** `openDrawer/closeDrawer`, backdrop click, `Escape`, focus trap (Tab cycle within drawer), return focus to button, set `aria-expanded/label`, mark active link by `location.pathname`. Respects `prefers-reduced-motion` (no slide, instant show — extend existing media query in `input.css:13-24`).

**Existing script.js:** split or guard — `initLightbox` only if `.lightbox-trigger` exists; `initMap/initBaseLayers` only if `#map` exists; `initShareButtons/initNavigateButtons/initSortControl` only if `#attractions-grid` exists; `initScrollAnimations` everywhere; delete `initScrollspy` (anchor-based, `script.js:630-650`) and replace with pathname active class; rewrite `initBackButton` (`script.js:659-687`): drawer-open → close; else if `history.length > 1` → `history.back()`; else `App.exitApp()`.

**Lightbox modal markup** moves to `gallery.html` only (currently global at end of index.html).

## 6. Data flow (build)

1. `build-pages.mjs` loads `base/nav/footer`, per-page fragment + meta.
2. Interpolates slots, writes `public/<page>.html`.
3. Tailwind compiles `src/input.css` → `public/style.css` (drawer + reveal + nav-active styles).
4. `cap sync` copies `public/` (including `tiles.json` bundle + images) to `android/`.

Relative asset paths (`images/...`, `style.css`, `js/...`, `./about.html`) everywhere — no leading `/`, so `file://` and `https://www.tineghir.ma/<page>.html` both resolve.

## 7. SEO / meta per page

Each entry in `pages.meta.json`: unique `<title>`, `description`, `og:*`/`twitter:*`, `canonical` (`https://www.tineghir.ma/<page>.html`, `/` for index), `TouristDestination` JSON-LD `url` per page. Expand `public/sitemap.xml` from 1 URL to 8 with `lastmod 2026-10-08`. `robots.txt` unchanged except sitemap line stays.

## 8. Error handling

- Build script fails fast on missing slot/fragment; validates every `href="./*.html"` target exists; warns on leftover `href="#about"`-style in-page anchors (except `href="#"` for JS hooks).
- Drawer JS null-safe (`if (!btn || !drawer) return`) so pages without drawer markup never throw.
- Map/tiles logic untouched (`initBaseLayers` hysteresis + banner); pages without `#map` skip entirely.
- `prefers-reduced-motion`: drawer + reveal become instant.

## 9. Testing / verification

- `npm run pages && npm run build`; confirm 8 files in `public/`, no `{{...}}` leftovers.
- Grep: no `href="#home|#about|#attractions|#gallery|#guide|#practical|#visit"` except intentional same-page `#` (e.g., sort toggle).
- Manual: each page at 390px (drawer open/close/backdrop/ESC/focus trap/scroll-lock) + desktop (row visible, button hidden); keyboard-only pass; `prefers-reduced-motion` pass.
- Attractions: sort/share/directions still mount; gallery: lightbox opens/closes; index + visit: map loads online + bundle fallback; other 6 pages: no map errors in console.
- `npx cap sync android` smoke test; Android back button: drawer → history → exit order.
- Lighthouse spot-check index + one content page.

## 10. Migration notes

Content moves verbatim; only nav/footer/head change. `public/index.html` becomes generated output (do not hand-edit after; edit `src/templates/pages/index.html`). Keep `public/script.js` API names stable so Capacitor + tests referencing them do not break; prefer guards over renames.
