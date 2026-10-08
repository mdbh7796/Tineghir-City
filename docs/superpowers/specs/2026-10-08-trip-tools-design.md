# Trip Tools (Checklist + Planner) — Design

Date: 2026-10-08
Status: Design approved in chat (Approach A, tools page)
Sub-project: 4 of 4 (stay, contact, transport shipped)
Parent context: 11-page static site built by `scripts/build-pages.mjs`,
verified by `scripts/check-pages.mjs`; per-page widgets in
`public/script.js` use guarded inits (`initShareButtons`,
`initNavigateButtons` mount on `#attractions-grid`; `initLightbox` on
`.lightbox-trigger`); share cascade is Web Share → clipboard with
`AbortError` tolerance (`shareAttraction`); no app-level localStorage
exists yet.

## 1. Intent

Give travelers two offline trip tools: a packing checklist and a
save-places planner, both persisted on-device, on one `tools.html` page.

## 2. Non-goals

- No accounts, sync, or server state (static site constraint).
- No new CSS framework pieces; existing utilities + card styles only.
- No changes to the share cascade semantics in `script.js`.

## 3. Storage contract — `public/js/tools.js`

`readList(key: string) -> string[]` returns parsed array or `[]` on any
failure (missing key, bad JSON, storage throws). `writeList(key: string,
arr: string[]) -> boolean` returns false (never throws) when storage is
unavailable (private mode, disabled cookies); UI shows a one-line
" saving unavailable on this device" notice in that case.
Keys: `tineghir-pack` (checked packing item ids), `tineghir-plan`
(attraction ids as produced by `cardAttractionId`). The helpers are
exposed as `window.__tools = { readList, writeList }` (`tools.js` loads
before `script.js` in `base.html`) so `initSaveButtons` reuses them
instead of touching `localStorage` directly.

## 4. Checklist

~12 curated items in three groups (Desert sun, Gorge walking,
Essentials), rendered as real `<input type="checkbox">` with `<label>`
in a hand-written `tools.html` fragment. State loads on init, persists
on change, progress line reads "N/12 packed". Group/item ids are stable
slugs (`sun-hat`, `gorge-shoes`, …); renaming an id resets that item.

## 5. Stars + planner + share

- `initSaveButtons()` in `public/script.js`, guarded by
  `#attractions-grid` (same mount pattern as share/directions buttons):
  appends a star toggle per card reusing `cardAttractionId()`;
  `aria-pressed` reflects saved state; toggles persist via `writeList`.
- Planner section on `tools.html` lists saved places by name from the
  existing `ATTRACTIONS` table (reused, not duplicated), each with
  remove and Directions links; empty state links to `attractions.html`.
- **Share plan** reuses the `shareAttraction` cascade (Web Share →
  `mailto:` with place list in body → clipboard); **Clear** empties the
  list with immediate UI update.

## 6. Integration

- `tools.html` via existing pipeline (`pages.meta.json`: title "Trip
  Tools - Packing & Planner", canonical
  `https://www.tineghir.ma/tools.html`, `showMap: false`,
  `leaflet: false`, `activeNav: "tools"`, fragments `["tools.html"]`;
  includes `js/tools.js` — global include in `base.html` is acceptable
  since every module null-guards its mounts).
- Drawer + footer links, sitemap (12th URL), cross-links from
  `visit.html` and `itineraries.html`.

## 7. Verification

- DOM-stub harness (throwaway, same technique as the drawer harness):
  star toggle persists across re-init; corrupted JSON seeds `[]`;
  storage-throwing stub never throws and shows the notice; share body
  lists saved names.
- `check-pages.mjs`: `tools.html` exists with checklist + planner
  sections, star-button mount present on attractions, sitemap lists 12.
- `node --check` on touched scripts; manual 390px tap pass.
