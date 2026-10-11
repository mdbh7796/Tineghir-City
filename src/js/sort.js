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
  btn.className = 'sort-toggle';
  const status = document.createElement('p');
  status.id = 'sort-status';
  status.setAttribute('role', 'status');
  status.className = 'sort-status';
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

