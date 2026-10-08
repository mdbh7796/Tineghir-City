# Offline map (§2): conditional tile layer

Status: switching logic + fetch pipeline implemented. No tile release
published yet — the offline layer is dormant until the `tiles.json` bump
PR lands (see ordering below). Range-in-APK UNPROVEN (spike ran desktop
only); the in-app Range test gates this feature (§6).

## How it works

`initMap` (`public/script.js`) mounts exactly one base layer on the same
`L.map` instance. Markers, popups, locate, sort, share are untouched.

- Online → OSM raster (`https://{s}.tile.openstreetmap.org`, unchanged).
- Offline → `protomaps-leaflet` reading the bundled archive whose path is
  the single config value `public/tiles.json » asset`.
- Startup: 4s reachability probe first (fail fast to bundle on captive
  portals). `navigator.onLine === false` skips the probe.
- Hysteresis: 3 consecutive live `tileerror`s in 60s → bundle. Swap back
  only after a successful probe (never on a bare `online` event) plus one
  live tile load. Single-tile probe every 5 min while on bundle.
- Both layers fail → stone panes, markers still render, non-blocking
  banner + Retry (idempotent: one attempt at a time, 10s cooldown).
- Leaflet 1.9.4 + protomaps-leaflet 5.1.0 are vendored
  (`public/vendor/`, npm-pinned). CDN cannot load offline.

## Assets and fetch

- `public/tiles.json` (committed pointer, read locally at runtime, never
  fetched remotely): `{version, releaseUrl, sha256, bbox, minZoom,
  maxZoom, asset}`. Bbox `[-6.10, 31.05, -5.40, 31.70]`, zooms 9–16.
- `scripts/fetch-tiles.mjs` downloads the release asset into
  `public/tiles/`, verifies SHA256, exits non-zero on any failure once a
  manifest exists. No manifest yet → warns, exits 0 (dormant).
- `*.pmtiles` gitignored. `cap sync` mirrors `public/tiles/` into the APK
  assets — never write `android/.../assets` directly, and never run bare
  `cap sync` (stale tiles); always use the `android:*` npm chains, which
  fetch first.
- Ordering (hard rule): owner uploads the release asset FIRST, computes
  SHA256, then the `tiles.json` bump PR merges. A `tiles.json` pointing at
  a missing asset breaks every android build by design (fail-closed).
- Tile updates ship with app releases. A `tiles-vN` release alone does NOT
  reach installed apps.

## Owner render pipeline (Planetiler, owner-run)

- Custom minimal profile (roads, place labels, POIs, water, light
  landuse) — never full OpenMapTiles schema. Resolved: POIs render at ALL
  zooms z9–16 (the z14–15 POI drop was rejected as non-monotonic).
- Zoom recipe in the profile, driven by `pins.geojson` exported from
  `ATTRACTIONS` (`public/script.js`): z9–13 full corridor bbox; z14–15
  roads + towns + POIs; z16 full detail only within ~2km of the 9 pins.
- OSM input: Geofabrik `morocco-latest.osm.pbf`. Bounds
  `--bounds="-6.10,31.05,-5.40,31.70"`, `--minzoom=9 --maxzoom=16`.
  (Planetiler version pinned when the owner runs it — record it here.)
- Dry-run size check FIRST. Budgets: soft 60MB, HARD 80MB. Re-tier at
  most once (shrink z16 radius, then drop z15). Still over → STOP, escalate.

## Attribution

OSM credit on both layers (ODbL); offline layer adds the Protomaps
credit. Swapped in the same `removeLayer`/`addLayer` call.

## Verification record (§6, pending)

| Check | Result |
|---|---|
| In-app Range head request | UNPROVEN |
| In-app Range tail request | UNPROVEN |
| Content-Type / Content-Range in-app | UNPROVEN |
| Capacitor version at test | 8.5.3 (repo) |
| androidScheme at test | default (https), no override |
| Floor device | minSdk 24 (Android 7.0); perf-gate run on Android 10 / 3GB |
| Cold-start | on-device measured number (not a CI gate) |

On-device matrix (all still to run): airplane mode, corridor edges,
signal gap mid-pan, fresh-install-no-signal, backgrounded-mid-pan,
live→bundle mid-pan, B1/B2/B3 determination. No-regression checklist:
markers, popups, locate, sort, share — on device.
