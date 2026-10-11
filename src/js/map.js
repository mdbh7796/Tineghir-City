// 3. Initialize Leaflet Map
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  const attractions = Object.values(ATTRACTIONS).filter(a => a.lat != null && a.lng != null);

  const map = L.map('map').setView([31.5139, -5.5316], 13);

  initBaseLayers(map); // §2 offline map: OSM raster online, bundled PMTiles offline

  attractions.forEach(a => {
    L.marker([a.lat, a.lng]).addTo(map)
      .bindPopup(`
        <b>${a.name}</b><br>
        <img src="${a.imgUrl}" alt="${a.name}" style="width:200px;height:120px;object-fit:cover;border-radius:8px;margin:6px 0">
        <p style="margin:0;font-size:13px;color:#555">${a.desc}</p>
      `);
  });

  // Deep-link: ?place=todra-gorge centers + opens popup. Share buttons can link here.
  try {
    const placeId = new URLSearchParams(window.location.search).get('place');
    const target = placeId ? (ATTRACTIONS[placeId] || ATTRACTIONS[CARD_TITLES[placeId]]) : null;
    if (target && target.lat != null) {
      map.setView([target.lat, target.lng], 14);
      L.marker([target.lat, target.lng]).addTo(map).bindPopup(`<b>${target.name}</b><br>${target.desc || ''}`).openPopup();
    }
  } catch {}

  // 'Locate me' control (native GPS via Capacitor, browser fallback)
  const mapStatus = document.createElement('div');
  mapStatus.setAttribute('role', 'status');
  mapStatus.setAttribute('aria-live', 'polite');
  mapStatus.className = 'visually-hidden';
  map.getContainer().appendChild(mapStatus);
  const locateBtn = L.control({ position: 'topright' });
  locateBtn.onAdd = () => {
    const btn = L.DomUtil.create('button', 'leaflet-locate-btn');
    btn.type = 'button';
    btn.title = 'Show my location';
    btn.setAttribute('aria-label', 'Show my location');
    btn.textContent = '📍';
    L.DomEvent.on(btn, 'click', async (e) => {
      L.DomEvent.stopPropagation(e);
      btn.textContent = '…';
      btn.setAttribute('aria-busy', 'true');
      mapStatus.textContent = 'Locating…';
      try {
        const pos = await getPosition();
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 14);
        L.marker([latitude, longitude]).addTo(map).bindPopup('You are here').openPopup();
        btn.textContent = '📍';
        mapStatus.textContent = 'Location found.';
      } catch (err) {
        btn.textContent = '📍';
        btn.title = err && err.message === 'denied'
          ? 'Location permission denied — enable it in system settings'
          : 'Could not get your location';
        mapStatus.textContent = btn.title;
      } finally {
        btn.removeAttribute('aria-busy');
      }
    });
    return btn;
  };
  locateBtn.addTo(map);
}

// 3b. Conditional base layer (§2 offline map, Approach A).
// Online  → OSM raster (URL/attribution byte-identical to the old code).
// Offline → protomaps-leaflet reading the bundled archive (public/tiles.json » asset).
// Same L.map instance; markers, popups, locate, sort, share are untouched.
// Hysteresis: 3 consecutive live tile errors in 60s before swapping to the
// bundle; swap back only after a successful reachability probe (never on a
// bare 'online' event — it strobes on flapping connections).
const TILES = {
  manifestUrl: 'tiles.json',
  probeTile: 'https://tile.openstreetmap.org/0/0/0.png',
  startupProbeTimeoutMs: 4000,
  backgroundProbeTimeoutMs: 8000,
  errorThreshold: 3,
  errorWindowMs: 60000,
  bundleProbeIntervalMs: 5 * 60 * 1000,
  retryCooldownMs: 10000,
  liveAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  // ODbL requires OSM credit on derived tiles; Protomaps asks for theirs too.
  bundleAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Protomaps basemap &copy; <a href="https://protomaps.com">Protomaps</a>',
};

async function resolveTilesManifest() {
  try {
    // Manifest is tiny and version-critical: never serve stale (else points at deleted .pmtiles).
    const res = await fetch(TILES.manifestUrl, { cache: 'reload' });
    if (!res.ok) return null;
    const m = await res.json();
    if (!m || typeof m.asset !== 'string' || !m.asset) return null;
    return m;
  } catch {
    return null; // No manifest (or unreadable): offline layer unavailable.
  }
}

async function probeLiveTiles(timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${TILES.probeTile}?probe=${Date.now()}`, {
      cache: 'no-store',
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function initBaseLayers(map) {
  const state = {
    active: null, // 'live' | 'bundle'
    manifest: null,
    manifestPromise: null,
    liveLayer: null,
    bundleLayer: null,
    liveErrors: 0,
    liveWindowStart: 0,
    bundleErrors: 0,
    bundleWindowStart: 0,
    retryInFlight: false,
    lastRetryAt: 0,
    banner: null,
  };

  const buildLiveLayer = () => {
    if (!state.liveLayer) {
      state.liveLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: TILES.liveAttribution,
      });
      state.liveLayer.on('tileload', () => {
        state.liveErrors = 0;
        state.liveWindowStart = 0;
      });
      state.liveLayer.on('tileerror', () => {
        if (state.active !== 'live') return;
        const now = Date.now();
        if (now - state.liveWindowStart > TILES.errorWindowMs) {
          state.liveErrors = 0;
          state.liveWindowStart = now;
        }
        state.liveErrors += 1;
        if (state.liveErrors >= TILES.errorThreshold) void useBundle('live-errors');
      });
    }
    return state.liveLayer;
  };

  const buildBundleLayer = () => {
    if (!state.bundleLayer) {
      state.bundleLayer = protomapsL.leafletLayer({
        url: state.manifest.asset,
        flavor: 'light',
        attribution: TILES.bundleAttribution,
      });
      state.bundleLayer.on('tileerror', () => {
        if (state.active !== 'bundle') return;
        const now = Date.now();
        if (now - state.bundleWindowStart > TILES.errorWindowMs) {
          state.bundleErrors = 0;
          state.bundleWindowStart = now;
        }
        state.bundleErrors += 1;
        if (state.bundleErrors >= TILES.errorThreshold) showTilesBanner('fail');
      });
    }
    return state.bundleLayer;
  };

  const mountLive = () => {
    if (state.active === 'live') return;
    if (state.bundleLayer) map.removeLayer(state.bundleLayer);
    buildLiveLayer().addTo(map);
    state.active = 'live';
    hideTilesBanner();
  };

  const useBundle = async (reason) => {
    if (!state.manifestPromise) state.manifestPromise = resolveTilesManifest();
    const manifest = await state.manifestPromise;
    if (!manifest || typeof protomapsL === 'undefined') {
      showTilesBanner(manifest ? 'fail' : 'missing');
      return;
    }
    state.manifest = manifest;
    if (state.active === 'bundle') return;
    if (state.liveLayer) map.removeLayer(state.liveLayer);
    try {
      buildBundleLayer().addTo(map);
    } catch {
      showTilesBanner('fail');
      return;
    }
    state.active = 'bundle';
    state.bundleErrors = 0;
    state.bundleWindowStart = 0;
    hideTilesBanner();
    void reason;
  };

  const ensureBanner = () => {
    if (state.banner) return state.banner;
    const el = document.createElement('div');
    el.setAttribute('role', 'alert');
    el.className = 'tiles-banner';
    el.style.display = 'none';
    const msg = document.createElement('span');
    msg.className = 'tiles-banner-msg';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Retry';
    btn.addEventListener('click', () => void retrySelection());
    el.append(msg, btn);
    map.getContainer().style.position = 'relative';
    map.getContainer().appendChild(el);
    state.banner = el;
    return el;
  };

  const showTilesBanner = (kind) => {
    const el = ensureBanner();
    el.querySelector('.tiles-banner-msg').textContent =
      kind === 'missing'
        ? 'Offline maps are not installed in this build — markers still work.'
        : 'Map tiles unavailable — markers still work. Check connection or reinstall with map data.';
    el.style.display = 'block';
  };

  const hideTilesBanner = () => {
    if (state.banner) state.banner.style.display = 'none';
  };

  // Idempotent retry: one attempt at a time, 10s cooldown — re-failure can't loop.
  const retrySelection = async () => {
    const now = Date.now();
    if (state.retryInFlight || now - state.lastRetryAt < TILES.retryCooldownMs) return;
    state.retryInFlight = true;
    state.lastRetryAt = now;
    try {
      await selectBaseLayer();
    } finally {
      state.retryInFlight = false;
    }
  };

  const selectBaseLayer = async () => {
    if (navigator.onLine === false) {
      await useBundle('offline');
      return;
    }
    // Startup/captive-portal probe: short timeout, fail fast to the bundle
    // instead of waiting out tile errors on a blank map.
    const live = await probeLiveTiles(TILES.startupProbeTimeoutMs);
    if (live) mountLive();
    else await useBundle('probe-failed');
  };

  window.addEventListener('offline', () => {
    state.liveErrors = 0;
    void useBundle('offline-event');
  });
  window.addEventListener('online', async () => {
    // Never swap on the bare event (flapping); require a live probe first.
    if (state.active === 'live') return;
    const live = await probeLiveTiles(TILES.backgroundProbeTimeoutMs);
    if (live) mountLive();
  });
  setInterval(async () => {
    if (state.active !== 'bundle' || document.hidden || state.retryInFlight) return;
    const live = await probeLiveTiles(TILES.backgroundProbeTimeoutMs);
    if (live) mountLive();
  }, TILES.bundleProbeIntervalMs);

  void selectBaseLayer();
}

// Public site URL shared from attraction cards (never a local/dev URL)
const SITE_URL = 'https://www.tineghir.ma';

// Unified position lookup: Capacitor native GPS in the app, browser API on web
async function getPosition() {
  const Geo = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation;
  if (Geo) {
    let perm = await Geo.checkPermissions();
    if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
      perm = await Geo.requestPermissions();
    }
    if (perm.location === 'granted' || perm.coarseLocation === 'granted') {
      return await Geo.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
    }
    throw new Error('denied');
  }
  if (!('geolocation' in navigator)) throw new Error('unsupported');
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (e) => {
      reject(new Error(e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable'));
    }, { timeout: 10000 });
  });
}

