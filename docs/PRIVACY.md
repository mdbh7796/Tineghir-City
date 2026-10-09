# Privacy

- Default deny: no analytics, no beacons load before you press **Accept**.
- Choice persists as `tineghir-consent` = `granted` | `denied` in localStorage.
- Accept currently records nothing locally (loader stub reserved for a future
  self-hosted, cookieless pageview). Decline loads nothing. Clear site data to reset.
- Maps: OSM raster online, bundled Protomaps offline. Tile CDN sees standard
  HTTP logs only when online layer is used.
- Location stays on-device (sort-by-distance, locate-me); never uploaded.
