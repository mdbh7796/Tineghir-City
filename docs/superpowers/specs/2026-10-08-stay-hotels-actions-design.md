# Stay & Hotels Actions — Design

Date: 2026-10-08
Status: Design approved in chat (Approach A, data-driven)
Sub-project: 1 of 4 (next: call actions, flights & transport, UX extras)
Parent context: 8-page static site built by `scripts/build-pages.mjs` from
`src/templates/` (base/nav/footer/pages) + `src/templates/pages.meta.json`,
verified by `scripts/check-pages.mjs`, styled with Tailwind, wrapped with
Capacitor (`webDir: public`, offline-first, `file://`-safe).

## 1. Intent

Make the app actionable for lodging: a visitor can pick a stay in Tineghir
and act on it — book online, call, message on WhatsApp, or navigate there —
without leaving the experience feeling stranded.

## 2. Non-goals

- No booking engine, availability, accounts, or payments (static site;
  decided: deep links out).
- No hotel content management beyond editing one JSON file.
- No JS filters/sorting on this pass (YAGNI; cards grouped by area).
- Sub-projects 2–4 (generic call directory, flights & transport, offline
  UX helpers) are separate specs.

## 3. Data — `src/templates/stays.json`

Array of entries, one per stay. Curated by implementer (well-known
Tineghir riads/kasbah-hotels); Booking.com links are name searches
(no partnership needed); Call/WhatsApp only where a public number is
known, otherwise omitted.

```json
{
  "name": "Riad Example",
  "area": "gorge-road | town | palmeraie",
  "priceBand": "budget | mid | splurge",
  "blurb": "One or two sentences, plain text, no markup.",
  "image": "images/<file>.jpg (must exist in public/images/)",
  "bookingUrl": "https://www.booking.com/searchresults.html?ss=<name>,+Tinghir",
  "phone": "+2126XXXXXXXX (E.164, optional)",
  "whatsapp": "2126XXXXXXXX (digits only, optional)",
  "mapsQuery": "<name>, Tinghir, Morocco",
  "verified": true
}
```

Rules: `name`, `area`, `priceBand`, `blurb`, `bookingUrl`, `mapsQuery`
required; `image`/`phone`/`whatsapp` optional; `area` and `priceBand`
limited to the listed enums; `verified: false` (location unconfirmable)
renders the card without Directions.

## 4. Card actions (each rendered only when its field exists)

- **Book** → `bookingUrl`, `target="_blank" rel="noopener"`.
- **Call** → `tel:<phone>` (same pattern as emergency cards on
  `practical.html`), `aria-label="Call <name>"`, 44px touch target.
- **WhatsApp** → `https://wa.me/<whatsapp>?text=<url-encoded
  "Hello <name>, I'd like to inquire about availability...">`
  (works in app + web).
- **Directions** → `https://www.google.com/maps/dir/?api=1
  &destination=<url-encoded mapsQuery>` (same as attraction cards),
  `target="_blank" rel="noopener"`, only when `verified: true`.

Cards grouped under three area headings (Gorge road / In town /
Palmeraie) with price-band badge; photo optional (placeholder block
when `image` absent). Every card always has ≥1 action (Book).

## 5. Integration

- New `stay.html` via the existing pipeline: `pages.meta.json` entry
  (`title: "Where to Stay in Tineghir"`, description, canonical
  `https://www.tineghir.ma/stay.html`, `showMap: false`,
  `leaflet: false`, `activeNav: "stay"`, plus
  `"staySource": "stays.json"` instead of `fragments` — `build-pages.mjs`
  renders the stay section in-memory from the data file; no hand-written
  `stay.html` fragment).
- Added to drawer nav (`nav.html`, `data-page="stay"`), footer Explore
  list, `sitemap.xml` (9th URL, `lastmod 2026-10-08`), header desktop
  row only if it fits 7 links + CTA (else drawer + footer only —
  implementer decides, records ruling).
- Linked from `visit.html` Where-to-Stay block and index teasers grid.
- `check-pages.mjs` page list extended to 9; sitemap assertion to 9 URLs.

## 6. Offline / error handling

- Cards render fully inline at build time: no `fetch`, no runtime JSON,
  `file://`-safe, SEO-visible.
- Book/Directions/WhatsApp need connectivity when tapped (same as
  existing attraction buttons); nothing pre-checks network.
- Build fails fast on: missing required field, bad `area`/`priceBand`
  enum, `image` file absent from `public/images/`, malformed
  `tel:`/`wa.me`/booking URL.
- Missing optional field → button omitted, never dead.

## 7. Verification

- `npm run pages && npm run build` exit 0; full
  `node scripts/check-pages.mjs` PASS.
- New assertions: `stay.html` exists; card count equals entries in
  `stays.json`; every card has ≥1 action link; `tel:` matches
  `^tel:\+212\d{9}$`; `wa.me` matches `^https://wa\.me/212\d{9}`;
  booking URLs are Booking.com search links; sitemap lists 9 URLs.
- `node --check` on touched scripts; manual 390px pass (4 actions
  tappable, drawer lists Stay, no horizontal overflow).
