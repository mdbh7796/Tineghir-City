
// Mobile menu is owned by js/drawer.js (slide-in drawer). This file keeps
// only per-page widgets; every init below is guarded by its mount element
// so pages without that section are safe no-ops.

// --- NEW FEATURES ---

// 1. Scroll Animations (Intersection Observer)
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optional: Stop observing once revealed
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1, // Trigger when 10% of element is visible
    rootMargin: '0px 0px -50px 0px' // Offset a bit so it triggers before bottom
  });

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

// 2. Gallery Lightbox
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  // Gallery-only widget: no triggers and no modal on other pages.
  if (!lightbox || !document.querySelector('.lightbox-trigger')) return;
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  if (!lightboxImg || !closeBtn) return;
  
  // Select all elements that should trigger lightbox
  const galleryItems = document.querySelectorAll('.lightbox-trigger');

  galleryItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      // Use explicit data attribute first (Robust)
      let src = item.getAttribute('data-lightbox-src');

      // Fallback: look for image tag
      if (!src) {
         const img = item.querySelector('img');
         if (img) src = img.src;
      }

      if (src) {
        lightboxImg.src = src;
        lightbox.classList.remove('hidden');
        // Small timeout to allow display:block to apply before opacity transition
        setTimeout(() => {
          lightbox.classList.remove('opacity-0');
          lightboxImg.classList.remove('scale-95');
        }, 10);
      }
    });
  });

  function closeLightbox() {
    lightbox.classList.add('opacity-0');
    lightboxImg.classList.add('scale-95');
    setTimeout(() => {
      lightbox.classList.add('hidden');
      lightboxImg.src = '';
    }, 300); // Match transition duration
  }

  closeBtn.addEventListener('click', closeLightbox);
  
  // Close on background click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
      closeLightbox();
    }
  });
}

// Pins must be checked in Google Maps before release.
const ATTRACTIONS = {
  'tineghir-center': { name: 'Tineghir City Center', lat: 31.5139, lng: -5.5316, kind: 'point', verified: true,
    desc: 'Gateway to Todra Gorge', imgUrl: 'images/hero-tineghir.jpg' },
  'todra-gorge': { name: 'Todra Gorge', lat: 31.58395, lng: -5.59161, kind: 'point', verified: true,
    desc: 'Towering 300m canyon walls, hiking & climbing', imgUrl: 'images/todra-gorge.jpg' },
  'palm-grove': { name: 'Palm Grove', lat: 31.5205, lng: -5.5302, kind: 'point', verified: true,
    desc: 'Lush oasis with date palms along the Todra River', imgUrl: 'images/tineghir-palm-grove.jpg' },
  'souks': { name: 'Traditional Souks', lat: 31.5125, lng: -5.5330, kind: 'point', verified: true,
    desc: 'Handicrafts, carpets, silver jewelry & spices', imgUrl: 'images/gallery-crafts.jpg' },
  'kasbah-el-glaoui': { name: 'Kasbah El Glaoui', lat: 31.5248, lng: -5.5312, kind: 'point', verified: true,
    desc: 'Historic mud-brick kasbah in the city center', imgUrl: 'images/about-tineghir.jpg' },
  'medina': { name: 'Medina of Tineghir', lat: 31.5147, lng: -5.5328, kind: 'point', verified: true,
    desc: 'Old medina with Berber architecture & narrow alleys', imgUrl: 'images/gallery-palms.jpg' },
  'dades-valley': { name: 'Dades Valley', lat: 31.4285, lng: -5.9754, kind: 'area', verified: true,
    desc: 'Hairpin roads and kasbah-dotted valleys', imgUrl: 'images/gallery-trek.jpg' },
  'todra-villages': { name: 'Todra Valley Villages', lat: 31.5450, lng: -5.5560, kind: 'area', verified: true,
    desc: 'Berber villages and terraced plots up the valley', imgUrl: 'images/gallery-palms.jpg' },
  'jebel-saghro': { name: 'Jebel Saghro', lat: 31.1333, lng: -5.6000, kind: 'area', verified: true,
    desc: 'Volcanic massif and nomad trails', imgUrl: 'images/todra-gorge-hike.jpg' },
};

// Card headings as written in index.html -> table keys.
const CARD_TITLES = {
  'Todra Gorge': 'todra-gorge',
  'Palm Grove (Palmerie)': 'palm-grove',
  'Kasbah El Glaoui': 'kasbah-el-glaoui',
  'Traditional Souks': 'souks',
  'Medina of Tineghir': 'medina',
  'Dades Valley': 'dades-valley',
  'Todra Valley Villages': 'todra-villages',
  'Jebel Saghro': 'jebel-saghro',
};

// Planner (tools page) reads names through this handle instead of a copy.
if (typeof window !== 'undefined') {
  window.__attractions = ATTRACTIONS;
}

function cardAttractionId(card) {
  if (card.dataset.attraction) return card.dataset.attraction;
  const h3 = card.querySelector('h3');
  const id = h3 ? CARD_TITLES[h3.textContent.trim()] : undefined;
  if (id) card.dataset.attraction = id;
  return id;
}

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
  mapStatus.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);';
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
    const res = await fetch(TILES.manifestUrl, { cache: 'force-cache' });
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

// 5. Directions buttons (Google Maps universal link; hidden unless verified)
function initNavigateButtons() {
  if (!document.getElementById('attractions-grid')) return;
  document.querySelectorAll('#attractions-grid > div').forEach(card => {
    const id = cardAttractionId(card);
    const a = id ? ATTRACTIONS[id] : undefined;
    if (!a || a.lat == null || a.lng == null || !a.verified) return;
    const link = document.createElement('a');
    link.className = 'directions-btn';
    link.textContent = 'Directions 🧭';
    link.href = `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', `Directions to ${a.name}`);
    link.style.cssText = 'margin-left:16px;font-size:14px;font-weight:500;color:#B45309;text-decoration:none;display:inline-flex;align-items:center;min-height:44px;padding:12px 0;';
    const shareBtn = card.querySelector('.share-btn');
    const container = card.querySelector('.p-6');
    if (shareBtn) shareBtn.after(link);
    else if (container) container.appendChild(link);
  });
}

// 6. Share buttons on attraction cards (native sheet via Capacitor, Web Share API, clipboard fallback)
function initShareButtons() {
  if (!document.getElementById('attractions-grid')) return;
  const cards = document.querySelectorAll('#attractions-grid > div');
  cards.forEach(card => {
    const nameEl = card.querySelector('h3');
    const descEl = card.querySelector('.p-6 p');
    const name = nameEl ? nameEl.textContent.trim() : 'Tineghir';
    const desc = descEl ? descEl.textContent.trim() : 'Discover Tineghir, Morocco.';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'share-btn';
    btn.textContent = 'Share ⤴';
    btn.style.cssText = 'margin-top:4px;font-size:14px;font-weight:500;color:#B45309;background:none;border:none;cursor:pointer;padding:12px 0;min-height:44px;';
    btn.addEventListener('click', () => shareAttraction(btn, name, desc));
    const container = card.querySelector('.p-6');
    if (container) container.appendChild(btn);
  });
}

async function shareAttraction(btn, name, desc) {
  const data = { title: `${name} — Tineghir`, text: desc, url: SITE_URL };
  const SharePlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share;
  try {
    if (SharePlugin && typeof SharePlugin.share === 'function') {
      await SharePlugin.share(data);
      return;
    }
    if (navigator.share) {
      await navigator.share(data);
      return;
    }
    throw new Error('no-share');
  } catch (err) {
    // User dismissal is not an error; otherwise fall back to clipboard
    if (err && (err.name === 'AbortError' || /cancel/i.test(err.message || ''))) return;
    try {
      await navigator.clipboard.writeText(`${data.title}\n${data.text}\n${data.url}`);
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    } catch (_) {
      btn.textContent = 'Share unavailable';
    }
  }
}

// 6b. Star buttons on attraction cards (saved-places planner, tools page)
function initSaveButtons() {
  const grid = document.getElementById('attractions-grid');
  const tools = window.__tools;
  if (!grid || !tools) return;
  const saved = new Set(tools.readList('tineghir-plan'));
  document.querySelectorAll('#attractions-grid > div').forEach(card => {
    if (card.querySelector('.save-btn')) return;
    const id = cardAttractionId(card);
    if (!id) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'save-btn';
    btn.style.cssText = 'margin-top:4px;margin-left:16px;font-size:14px;font-weight:500;color:#B45309;background:none;border:none;cursor:pointer;padding:12px 0;min-height:44px;';
    const paint = () => {
      const on = saved.has(id);
      btn.setAttribute('aria-pressed', String(on));
      const name = (ATTRACTIONS[id] && ATTRACTIONS[id].name) || 'place';
      btn.setAttribute('aria-label', on ? `Remove ${name} from trip plan` : `Save ${name} to trip plan`);
      btn.textContent = on ? '★ Saved' : '☆ Save';
    };
    paint();
    btn.addEventListener('click', () => {
      if (saved.has(id)) saved.delete(id);
      else saved.add(id);
      tools.writeList('tineghir-plan', [...saved]);
      paint();
    });
    const container = card.querySelector('.p-6');
    if (container) container.appendChild(btn);
  });
}

// 7. Sort attractions by distance (verified pins only, in-place reorder)
let cachedPosition = null;
let sortOriginalOrder = null;

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(km, kind) {
  if (kind === 'area' || km >= 1) {
    const prefix = kind === 'area' ? '~' : '';
    return `${prefix}${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
  }
  return 'In town';
}

function setSortMessage(text) {
  const status = document.getElementById('sort-status');
  if (status) status.textContent = text;
}

function setDistanceLabels(show, entries) {
  document.querySelectorAll('#attractions-grid > div').forEach(card => {
    const old = card.querySelector('.distance-label');
    if (old) old.remove();
  });
  if (!show || !entries) return;
  entries.forEach(({ card, km, kind }) => {
    const label = document.createElement('span');
    label.className = 'distance-label';
    label.textContent = formatDistance(km, kind);
    label.style.cssText = 'display:block;font-size:13px;color:#78716c;margin-top:4px;';
    const meta = card.querySelector('.p-6 p.text-stone-500');
    const container = card.querySelector('.p-6');
    if (meta) meta.after(label);
    else if (container) container.appendChild(label);
  });
}

function initSortControl() {
  const header = document.querySelector('#attractions .text-center');
  if (!header || document.getElementById('sort-toggle')) return;
  const btn = document.createElement('button');
  btn.id = 'sort-toggle';
  btn.type = 'button';
  btn.textContent = 'Sort by distance';
  btn.setAttribute('aria-pressed', 'false');
  btn.style.cssText = 'margin-top:20px;font-size:15px;font-weight:500;color:#B45309;background:#fff;border:2px solid #D97706;border-radius:9999px;padding:10px 24px;min-height:48px;cursor:pointer;';
  const status = document.createElement('p');
  status.id = 'sort-status';
  status.setAttribute('role', 'status');
  status.style.cssText = 'margin-top:12px;font-size:14px;color:#57534e;min-height:20px;';
  btn.addEventListener('click', onSortToggle);
  header.appendChild(btn);
  header.appendChild(status);
}

async function onSortToggle() {
  const btn = document.getElementById('sort-toggle');
  const grid = document.getElementById('attractions-grid');
  if (!btn || !grid) return;
  const isOn = btn.getAttribute('aria-pressed') === 'true';
  if (isOn) {
    if (sortOriginalOrder) sortOriginalOrder.forEach(card => grid.appendChild(card));
    setDistanceLabels(false);
    btn.setAttribute('aria-pressed', 'false');
    setSortMessage('Original order restored.');
    return;
  }
  let pos = cachedPosition;
  if (!pos) {
    try {
      pos = await getPosition();
      cachedPosition = pos;
    } catch (err) {
      setSortMessage('Location unavailable — showing places in the original order.');
      return;
    }
  }
  if (!sortOriginalOrder) sortOriginalOrder = [...grid.children];
  const sortable = [];
  const rest = [];
  [...grid.children].forEach(card => {
    const a = ATTRACTIONS[cardAttractionId(card)];
    if (a && a.verified && a.lat != null && a.lng != null) {
      sortable.push({ card, km: haversine(pos.coords.latitude, pos.coords.longitude, a.lat, a.lng), kind: a.kind });
    } else {
      rest.push(card);
    }
  });
  if (!sortable.length) {
    setSortMessage('No verified places to sort yet.');
    return;
  }
  sortable.sort((x, y) => x.km - y.km);
  sortable.forEach(({ card }) => grid.appendChild(card));
  rest.forEach(card => grid.appendChild(card));
  setDistanceLabels(true, sortable);
  btn.setAttribute('aria-pressed', 'true');
  setSortMessage('Places sorted by straight-line distance, closest first.');
}

// 8. Active nav link is set by js/drawer.js from location.pathname
// (the old anchor scrollspy has no sections to observe on split pages).

// 9. Android back button: drawer -> page history -> exit.
// Native only (the event fires solely in the Capacitor app); in a desktop
// browser the default back behavior is untouched.
function initBackButton() {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!App || typeof App.addListener !== 'function') return;

  App.addListener('backButton', () => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && !lightbox.classList.contains('hidden')) {
      document.getElementById('lightbox-close').click();
      return;
    }
    const drawerApi = window.__drawer;
    if (drawerApi && drawerApi.isDrawerOpen()) {
      drawerApi.closeDrawer(true);
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    if (typeof App.exitApp === 'function') App.exitApp();
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initLightbox();
  initMap();
  initShareButtons();
  initSaveButtons();
  initNavigateButtons();
  initSortControl();
  initBackButton();
});
