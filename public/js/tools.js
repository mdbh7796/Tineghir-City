// Trip tools: guarded localStorage lists + packing checklist.
// Planner UI and star buttons build on window.__tools (see Task 2).
function store() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readList(key) {
  try {
    const s = store();
    if (!s) return [];
    const v = JSON.parse(s.getItem(key));
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(key, arr) {
  try {
    const s = store();
    if (!s) return false;
    s.setItem(key, JSON.stringify(arr));
    return true;
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.__tools = { readList, writeList, renderPlanner, sharePlan, clearPlan };
}

function storageOK() {
  try {
    const s = store();
    if (!s) return false;
    s.setItem('tineghir-probe', '1');
    s.removeItem('tineghir-probe');
    return true;
  } catch {
    return false;
  }
}

function initChecklist() {
  const list = document.getElementById('pack-list');
  if (!list) return;
  const boxes = [...list.querySelectorAll('input[type="checkbox"][data-pack]')];
  const progress = document.getElementById('pack-progress');
  const notice = document.getElementById('pack-notice');
  const saved = new Set(readList('tineghir-pack'));
  const canSave = storageOK();
  if (notice) notice.hidden = canSave;
  const paint = () => {
    const checked = boxes.filter((b) => b.checked).map((b) => b.dataset.pack);
    if (progress) progress.textContent = `${checked.length}/${boxes.length} packed`;
    return checked;
  };
  boxes.forEach((b) => { b.checked = saved.has(b.dataset.pack); });
  paint();
  list.addEventListener('change', () => {
    const ok = writeList('tineghir-pack', paint());
    if (notice) notice.hidden = ok;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initChecklist();
  renderPlanner();
});

function siteAttractions() {
  try {
    return (typeof window !== 'undefined' && window.__attractions) || {};
  } catch {
    return {};
  }
}

function escH(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function renderPlanner() {
  const list = document.getElementById('plan-list');
  if (!list) return;
  const data = siteAttractions();
  const ids = readList('tineghir-plan').filter((id) => data[id]);
  const shareBtn = document.getElementById('plan-share');
  const clearBtn = document.getElementById('plan-clear');
  if (!ids.length) {
    list.innerHTML = '<div class="bg-white rounded-2xl p-6 shadow-lg">'
      + '<p class="text-stone-600">Nothing saved yet. Star places on the '
      + '<a href="./attractions.html" class="text-amber-700 hover:text-amber-600 font-medium">attractions page</a>'
      + ' and they will appear here.</p></div>';
    if (shareBtn) shareBtn.hidden = true;
    if (clearBtn) clearBtn.hidden = true;
    return;
  }
  list.innerHTML = ids.map((id) => {
    const a = data[id];
    const dirs = `https://www.google.com/maps/dir/?api=1&amp;destination=${encodeURIComponent(a.lat + ',' + a.lng)}`;
    return '<div class="bg-white rounded-2xl p-6 shadow-lg">'
      + `<h3 class="font-display text-xl font-bold text-stone-800 mb-2">${escH(a.name)}</h3>`
      + `<p class="text-stone-600 mb-4">${escH(a.desc || '')}</p>`
      + '<div class="flex flex-wrap gap-3">'
      + `<a href="${dirs}" target="_blank" rel="noopener" class="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium min-h-[44px] text-amber-700 hover:text-amber-600">Directions 🧭</a>`
      + `<button type="button" data-remove="${escH(id)}" class="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium min-h-[44px] text-stone-500 hover:text-red-700">Remove</button>`
      + '</div></div>';
  }).join('');
  list.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      writeList('tineghir-plan', readList('tineghir-plan').filter((x) => x !== btn.getAttribute('data-remove')));
      renderPlanner();
    });
  });
  if (shareBtn) { shareBtn.hidden = false; shareBtn.onclick = sharePlan; }
  if (clearBtn) { clearBtn.hidden = false; clearBtn.onclick = clearPlan; }
}

async function sharePlan() {
  const data = siteAttractions();
  const ids = readList('tineghir-plan').filter((id) => data[id]);
  if (!ids.length) return;
  const text = 'My Tineghir plan:\n' + ids.map((id) => `- ${data[id].name}`).join('\n');
  const payload = { title: 'My Tineghir plan', text };
  const capShare = typeof window !== 'undefined' && window.Capacitor
    && window.Capacitor.Plugins && window.Capacitor.Plugins.Share;
  try {
    if (capShare && typeof capShare.share === 'function') {
      await capShare.share(payload);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(payload);
      return;
    }
    throw new Error('no-share');
  } catch (err) {
    if (err && (err.name === 'AbortError' || /cancel/i.test(err.message || ''))) return;
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = `mailto:?subject=${encodeURIComponent(payload.title)}&body=${encodeURIComponent(text)}`;
      return;
    }
    try {
      await navigator.clipboard.writeText(`${payload.title}\n${text}`);
    } catch (_) {
      const notice = document.getElementById('plan-notice');
      if (notice) { notice.hidden = false; notice.textContent = 'Sharing is unavailable on this device.'; }
    }
  }
}

function clearPlan() {
  writeList('tineghir-plan', []);
  renderPlanner();
}
