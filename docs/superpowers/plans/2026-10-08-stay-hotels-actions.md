# Stay & Hotels Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a data-driven `stay.html` page of bookable Tineghir stays with Book / Call / WhatsApp / Directions actions.

**Architecture:** `src/templates/stays.json` data file rendered in-memory by `scripts/build-pages.mjs` (new `staySource` meta key, validated at build); sitemap rendered from meta canonicals so page 9 can't drift; existing drawer/footer/check pipeline extended.

**Tech Stack:** Static HTML, Node 22+ build script, Tailwind v4 CLI, vanilla JS (no new runtime JS).

**Spec:** `docs/superpowers/specs/2026-10-08-stay-hotels-actions-design.md`

## Global Constraints

- All output stays static files in `public/`; no framework, no runtime fetch, no backend.
- All links relative except provider absolutes (`booking.com`, `wa.me`, `google.com/maps`, `tel:`).
- Build order: `npm run pages` → Tailwind → `npx cap sync android`.
- `tel:` must match `^tel:\+212\d{9}$`; `wa.me` must match `^https://wa\.me/212\d{9}`.
- Every card always has ≥1 action (Book); missing optional field → button omitted, never dead.
- `verified: false` renders the card without Directions.
- 44px minimum touch targets on all action buttons.

## Review Focus

- A `phone` like `06 XX` (local format, no +212) renders a dead `tel:` link — a tap that dials nothing is worse than no button; build must reject non-E.164 and the test pins it.
- An `image` filename not present in `public/images/` ships a broken `<img>` — reasonable person expects photos or a clean placeholder, never a broken icon; build must fail and the test pins it.
- A `bookingUrl` typo (wrong host, unencoded spaces) lands the traveler on a provider 404 — test pins host + encoding.
- An unverified entry with a guessed `mapsQuery` navigates to the wrong town — `verified: false` must suppress Directions and the test pins it.
- A `whatsapp` value with `+`, spaces, or dashes breaks `wa.me` routing — build must reject non-digit strings and the test pins it.

---

### Task 1: stays.json data + build rendering + validation

**Files:**
- Create: `src/templates/stays.json`
- Modify: `scripts/build-pages.mjs`
- Modify: `scripts/check-pages.mjs`
- Test: `node scripts/check-pages.mjs --scope=pages,stay`

**Interfaces:**
- Consumes: `buildPages(rootDir: string) -> string[]` and `pages.meta.json` shape from the multipage plan.
- Produces: `validateStays(stays: unknown) -> StayEntry[]` (throws via `fail()` on any rule breach); `renderStaySection(stays: StayEntry[]) -> string` (area-grouped cards HTML); `staySource` meta key consumed by `buildPages`; `--scope=stay` check gate used by Tasks 2–3.

- [ ] **Step 1: Write the failing stay assertions in `scripts/check-pages.mjs`**

```js
// --scope=stay: public/stay.html exists; card count (data-stay attributes)
// equals entries in src/templates/stays.json; every card has ≥1 action link;
// tel: matches ^tel:\+212\d{9}$; wa.me matches ^https://wa\.me/212\d{9};
// booking hrefs start with https://www.booking.com/searchresults.html?ss=;
// every card image src resolves to a file in public/images/ (or a styled
// placeholder block when imageless);
// unverified entries have no maps/dir link.
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node scripts/check-pages.mjs --scope=pages,stay`
Expected: FAIL with "missing public/stay.html"

- [ ] **Step 3: Implement `src/templates/stays.json` with 6–8 curated entries**

Real well-known Tineghir stays across `gorge-road` / `town` / `palmeraie` and `budget` / `mid` / `splurge`; `bookingUrl` as Booking.com name search; `phone`/`whatsapp` only where publicly known; `verified: true` only for confirmable locations.

- [ ] **Step 4: Implement `validateStays` + `renderStaySection` in `scripts/build-pages.mjs`**

Reject: missing required field, bad `area`/`priceBand` enum, `image` absent from `public/images/`, non-E.164 `phone`, non-digit `whatsapp`, non-Booking `bookingUrl`, unencoded spaces in URLs. Render area-grouped cards with conditional Book/Call/WhatsApp/Directions buttons (44px targets, `aria-label="Call <name>"`, `target="_blank" rel="noopener"` on outbound). Wire `staySource` meta key into `buildPages`.

- [ ] **Step 5: Run checks to verify pass**

Run: `node scripts/check-pages.mjs --scope=pages,stay`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/templates/stays.json scripts/build-pages.mjs scripts/check-pages.mjs
git commit -m "feat: render stay page from validated stays data"
```

### Task 2: Page wiring — meta, nav, footer, sitemap, cross-links

**Files:**
- Modify: `src/templates/pages.meta.json` (add `stay` entry with `staySource`)
- Modify: `src/templates/nav.html` (drawer Stay link)
- Modify: `src/templates/footer.html` (Explore Stay link)
- Modify: `scripts/build-pages.mjs` (render `public/sitemap.xml` from meta canonicals)
- Modify: `src/templates/pages/visit.html` (Where-to-Stay block links `./stay.html`)
- Modify: `src/templates/pages/_teasers.html` (About-card row gains Stay teaser or retargets)
- Test: `node scripts/check-pages.mjs` (full)

**Interfaces:**
- Consumes: `staySource` rendering + `--scope=stay` gate from Task 1.
- Produces: 9-page site with Stay in drawer/footer/sitemap/cross-links; sitemap generated from meta (no hand drift).

- [ ] **Step 1: Extend the check (sitemap-from-meta + wiring assertions)**

```js
// full scope: pages list has 9 entries incl. stay; every page links no legacy
// anchors; drawer + footer contain ./stay.html; sitemap.xml lists all 9 meta
// canonicals; visit.html links ./stay.html.
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node scripts/check-pages.mjs`
Expected: FAIL with "missing public/stay.html" (meta entry absent) and sitemap missing stay URL

- [ ] **Step 3: Implement meta entry + nav/footer/cross-links + sitemap rendering**

`stay` meta: title "Where to Stay in Tineghir", canonical `https://www.tineghir.ma/stay.html`, `showMap: false`, `leaflet: false`, `activeNav: "stay"`, `staySource: "stays.json"`. Drawer + footer gain Stay links. `build-pages.mjs` writes `public/sitemap.xml` from all meta canonicals (`lastmod 2026-10-08`, index priority 1.0, rest 0.7–0.9 as today). Header desktop row: keep 6 links + CTA unchanged (drawer + footer carry Stay) and ledger the ruling.

- [ ] **Step 4: Run full check to verify pass**

Run: `npm run pages; node scripts/check-pages.mjs`
Expected: PASS (9 pages, sitemap, wiring)

- [ ] **Step 5: Commit**

```bash
git add src/templates/pages.meta.json src/templates/nav.html src/templates/footer.html src/templates/pages/visit.html src/templates/pages/_teasers.html scripts/build-pages.mjs scripts/check-pages.mjs public/sitemap.xml public/*.html
git commit -m "feat: wire stay page into nav, footer, sitemap, and cross-links"
```

### Task 3: Rebuild, style verification, final green

**Files:**
- Modify: `public/style.css` (regenerated only)
- Test: full `node scripts/check-pages.mjs` + `node --check` on scripts

**Interfaces:**
- Consumes: Tasks 1–2 output.
- Produces: shippable `public/` with 9 indexed pages.

- [ ] **Step 1: Run full verification**

Run: `npm run build; node scripts/check-pages.mjs; node --check scripts/build-pages.mjs; node --check scripts/check-pages.mjs`
Expected: PASS everywhere, exit 0; `public/style.css` contains `.site-drawer`; stay cards use existing utility classes only (no new CSS needed — verify by grep that no unknown custom class appears in rendered stay.html)

- [ ] **Step 2: Commit regenerated assets**

```bash
git add public/style.css public/*.html
git commit -m "feat: rebuild assets with stay page"
```
