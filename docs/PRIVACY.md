# Privacy

- No analytics, no beacons, no tracking SDK, no consent prompt. Nothing loads
  beyond the site's own assets, online OpenStreetMap tiles when the online layer
  is active, and the user-initiated links they choose to open.
- No account and no server receiving behavior. There is nothing to opt into.
- Maps: OSM raster online, bundled Protomaps offline. Tile CDN sees standard
  HTTP logs only when the online layer is used.
- Location stays on-device (sort-by-distance, locate-me); never uploaded.

## Android permissions

- `INTERNET`: loads online map tiles / fonts when online. Offline content works without it.
- `ACCESS_COARSE_LOCATION` + `ACCESS_FINE_LOCATION`: only for "locate me" /
  sort-by-distance. Requested at runtime, stays on-device, never uploaded.
- `usesCleartextTraffic="false"`: all traffic must be HTTPS.
- If you deny location, the site still works — distance sorting just stays disabled.
