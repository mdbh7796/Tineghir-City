
// Mobile menu toggle
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('mobile-menu-btn');
  menu.classList.toggle('active');
  const open = menu.classList.contains('active');
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) {
    const firstLink = menu.querySelector('a');
    if (firstLink) firstLink.focus();
  }
});

function closeMobileMenu(refocus = false) {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('mobile-menu-btn');
  if (!menu.classList.contains('active')) return;
  menu.classList.remove('active');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Open menu');
  if (refocus) btn.focus();
}

// Escape closes the mobile menu (lightbox has its own handler)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileMenu(true);
});

// Close mobile menu when clicking a link
document.querySelectorAll('#mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    closeMobileMenu(false);
  });
});

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
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  
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
  'todra-gorge': { name: 'Todra Gorge', lat: 31.58395, lng: -5.59161, kind: 'point', verified: false,
    desc: 'Towering 300m canyon walls, hiking & climbing', imgUrl: 'images/todra-gorge.jpg' },
  'palm-grove': { name: 'Palm Grove', lat: 31.5200, lng: -5.5300, kind: 'point', verified: false,
    desc: 'Lush oasis with date palms along the Todra River', imgUrl: 'images/tineghir-palm-grove.jpg' },
  'souks': { name: 'Traditional Souks', lat: 31.5100, lng: -5.5310, kind: 'point', verified: false,
    desc: 'Handicrafts, carpets, silver jewelry & spices', imgUrl: 'images/gallery-crafts.jpg' },
  'kasbah-el-glaoui': { name: 'Kasbah El Glaoui', lat: 31.5110, lng: -5.5300, kind: 'point', verified: false,
    desc: 'Historic mud-brick kasbah in the city center', imgUrl: 'images/about-tineghir.jpg' },
  'medina': { name: 'Medina of Tineghir', lat: 31.5120, lng: -5.5320, kind: 'point', verified: false,
    desc: 'Old medina with Berber architecture & narrow alleys', imgUrl: 'images/gallery-palms.jpg' },
  'dades-valley': { name: 'Dades Valley', lat: null, lng: null, kind: 'area', verified: false,
    desc: 'Hairpin roads and kasbah-dotted valleys', imgUrl: 'images/gallery-trek.jpg' },
  'todra-villages': { name: 'Todra Valley Villages', lat: null, lng: null, kind: 'area', verified: false,
    desc: 'Berber villages and terraced plots up the valley', imgUrl: 'images/gallery-palms.jpg' },
  'jebel-saghro': { name: 'Jebel Saghro', lat: null, lng: null, kind: 'area', verified: false,
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

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  attractions.forEach(a => {
    L.marker([a.lat, a.lng]).addTo(map)
      .bindPopup(`
        <b>${a.name}</b><br>
        <img src="${a.imgUrl}" alt="${a.name}" style="width:200px;height:120px;object-fit:cover;border-radius:8px;margin:6px 0">
        <p style="margin:0;font-size:13px;color:#555">${a.desc}</p>
      `);
  });

  // 'Locate me' control (native GPS via Capacitor, browser fallback)
  const locateBtn = L.control({ position: 'topright' });
  locateBtn.onAdd = () => {
    const btn = L.DomUtil.create('button', 'leaflet-locate-btn');
    btn.type = 'button';
    btn.title = 'Show my location';
    btn.setAttribute('aria-label', 'Show my location');
    btn.textContent = '📍';
    btn.style.cssText = 'width:44px;height:44px;background:#fff;border:2px solid rgba(0,0,0,0.2);border-radius:4px;cursor:pointer;font-size:20px;line-height:40px;';
    L.DomEvent.on(btn, 'click', async (e) => {
      L.DomEvent.stopPropagation(e);
      btn.textContent = '…';
      try {
        const pos = await getPosition();
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 14);
        L.marker([latitude, longitude]).addTo(map).bindPopup('You are here').openPopup();
        btn.textContent = '📍';
      } catch (err) {
        btn.textContent = '📍';
        btn.title = err && err.message === 'denied'
          ? 'Location permission denied — enable it in system settings'
          : 'Could not get your location';
      }
    });
    return btn;
  };
  locateBtn.addTo(map);
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


// 8. Scrollspy: highlight the nav link for the section in view
function initScrollspy() {
  const links = document.querySelectorAll('nav a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = {};
  links.forEach(link => {
    const id = link.getAttribute('href').slice(1);
    if (!byId[id]) byId[id] = [];
    byId[id].push(link);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => link.classList.remove('nav-active'));
      (byId[entry.target.id] || []).forEach(link => link.classList.add('nav-active'));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  Object.keys(byId).forEach(id => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

// 9. Android back button: lightbox -> menu -> in-page history -> exit.
// Native only (the event fires solely in the Capacitor app); in a desktop
// browser the default back behavior is untouched.
function initBackButton() {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!App || typeof App.addListener !== 'function') return;

  // In-page nav links push hash entries; count them deliberately so back
  // walks the section history instead of exiting the app early.
  let hashEntries = 0;
  let skipNextHash = false;
  window.addEventListener('hashchange', () => {
    if (skipNextHash) { skipNextHash = false; return; }
    hashEntries++;
  });

  App.addListener('backButton', () => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && !lightbox.classList.contains('hidden')) {
      document.getElementById('lightbox-close').click();
      return;
    }
    const menu = document.getElementById('mobile-menu');
    if (menu && menu.classList.contains('active')) {
      closeMobileMenu(true);
      return;
    }
    if (hashEntries > 0) {
      hashEntries--;
      skipNextHash = true;
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
  initNavigateButtons();
  initScrollspy();
  initBackButton();
});
