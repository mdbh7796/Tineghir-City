# Privacy

- Default deny: no analytics, no beacons load before you press **Accept**.
- Choice persists as `tineghir-consent` = `granted` | `denied` in localStorage.
- Accept enables a single self-hosted Plausible pageview (no cookies, no cross-site).
  Decline loads nothing. Clear site data to reset.
- Maps: OSM raster online, bundled Protomaps offline. Tile CDN sees standard
  HTTP logs only when online layer is used.
- Location stays on-device (sort-by-distance, locate-me); never uploaded.
