# Trip Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an offline `tools.html` page with a persistent packing checklist and a save-places planner fed by star buttons on attraction cards.

**Architecture:** `public/js/tools.js` owns the storage contract (`window.__tools`) and the tools-page UI; `initSaveButtons()` in `public/script.js` reuses it for stars; the page itself is a hand-written fragment through the existing template pipeline.

**Tech Stack:** Static HTML, vanilla JS + localStorage, Node build/check scripts.

**Spec:** `docs/superpowers/specs/2026-10-08-trip-tools-design.md`

## Global Constraints

- `readList(key)` returns `[]` on any failure, never throws; `writeList(key, arr)` returns false (never throws) when storage is unavailable.
- Keys are exactly `tineghir-pack` and `tineghir-plan`; values are JSON string arrays.
- Star buttons reuse `cardAttractionId()`; cards without an id are skipped, never crash.
- Share reuses the `shareAttraction` cascade (Web Share → `mailto:` → clipboard).
- Group/item ids are stable slugs; 44px touch targets; existing utilities only.

## Review Focus

- Private-mode Safari throws on `localStorage.setItem` — the traveler expects the page to work read-only with a notice, not a blank crash; pinned by Task 1 harness (throwing-store stub).
- Corrupted `tineghir-plan` JSON (user edited devtools, older format) — planner must show the empty state, not throw; pinned by Task 2 harness (seeded garbage).
- A future attraction card whose title isn't in `CARD_TITLES` — star button must be skipped, page must still init; pinned by Task 2 harness (unknown-title card).
- Share with an empty plan — button must be hidden/disabled rather than sharing an empty list; pinned by Task 2 check (no share control when list empty).
- `window.localStorage` itself undefined (rare embedded webviews) — every storage touch must go through the guarded helpers; pinned by Task 1 harness (no-localStorage stub).

---

### Task 1: Storage helper + checklist + page wiring

**Files:**
- Create: `public/js/tools.js`
- Create: `src/templates/pages/tools.html`
- Modify: `src/templates/base.html` (include `js/tools.js` before `script.js`)
- Modify: `src/templates/pages.meta.json` (tools entry)
- Modify: `src/templates/nav.html`, `src/templates/footer.html` (Tools links)
- Modify: `src/templates/pages/visit.html`, `src/templates/pages/itineraries.html` (cross-links)
- Modify: `scripts/check-pages.mjs`
- Test: throwaway DOM-stub harness + `node scripts/check-pages.mjs`

**Interfaces:**
- Consumes: base/nav/footer/meta pipeline, `shareAttraction` cascade (Task 2).
- Produces: `window.__tools = { readList(key: string) -> string[], writeList(key: string, arr: string[]) -> boolean }`; checklist item slugs (`sun-hat`, …); `--scope=tools` gate.

- [ ] **Step 1: Write the failing harness + check assertions**

```js
// harness (throwaway): throwing-store stub → writeList false, readList [],
// notice shown; no-localStorage stub → same, no throw.
// check --scope=tools: tools.html exists with #pack-list + #plan-list,
// 12N packed progress element, sitemap lists tools URL.
```

- [ ] **Step 2: Run to verify they fail**

Run: `node scripts/check-pages.mjs --scope=pages,tools`
Expected: FAIL with "missing public/tools.html"

- [ ] **Step 3: Implement `readList`/`writeList` in `public/js/tools.js`**

Try/catch around every storage touch; expose on `window.__tools`.

- [ ] **Step 4: Implement checklist UI + `tools.html` fragment + wiring**

12 items in 3 groups with stable slugs; progress "N/12 packed"; meta/nav/footer/sitemap/cross-links per spec §6.

- [ ] **Step 5: Run gates to verify pass**

Run: `npm run pages; node scripts/check-pages.mjs --scope=pages,tools`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add public/js/tools.js src/templates/pages/tools.html src/templates/base.html src/templates/pages.meta.json src/templates/nav.html src/templates/footer.html src/templates/pages/visit.html src/templates/pages/itineraries.html scripts/check-pages.mjs public/*.html public/sitemap.xml
git commit -m "feat: trip tools page with packing checklist"
```

### Task 2: Stars + planner + share

**Files:**
- Modify: `public/script.js` (`initSaveButtons`, DOMContentLoaded call)
- Modify: `src/templates/pages/tools.html` (planner + share/clear UI)
- Test: throwaway harness + full check

**Interfaces:**
- Consumes: `window.__tools` + checklist slugs from Task 1; `cardAttractionId`, `ATTRACTIONS`, share cascade.
- Produces: starred plan persisted under `tineghir-plan`, rendered planner.

- [ ] **Step 1: Write failing harness cases**

```js
// star toggle persists across re-init; garbage-seeded plan renders empty
// state; unknown-title card skipped without throw; share body lists saved
// names; empty plan hides share control.
```

- [ ] **Step 2: Run to verify they fail**

Run: harness
Expected: FAIL (no `initSaveButtons`)

- [ ] **Step 3: Implement `initSaveButtons` + planner UI**

Guarded by `#attractions-grid`; `aria-pressed` toggles; planner rows with remove + Directions; share/clear; empty states.

- [ ] **Step 4: Run harness + full suite to verify pass**

Run: harness, then `npm run build; node scripts/check-pages.mjs; node scripts/test-validate-stays.mjs`
Expected: PASS everywhere

- [ ] **Step 5: Commit**

```bash
git add public/script.js src/templates/pages/tools.html public/attractions.html public/tools.html
git commit -m "feat: saved-places planner with attraction stars"
```

### Task 3: Final verification + rebuild commit

**Files:**
- Modify: `public/style.css`, `public/*.html` (regenerated only)
- Test: full suite + `node --check` on touched scripts

- [ ] **Step 1: Run full verification**

Run: `npm run build; node scripts/check-pages.mjs; node --check public/js/tools.js; node --check public/script.js`
Expected: PASS, exit 0; tools page uses existing classes only (compare class set vs other pages)

- [ ] **Step 2: Commit regenerated assets**

```bash
git add public/style.css public/*.html
git commit -m "feat: rebuild assets with trip tools"
```
