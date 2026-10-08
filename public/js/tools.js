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
  window.__tools = { readList, writeList };
}

function initChecklist() {
  const list = document.getElementById('pack-list');
  if (!list) return;
  const boxes = [...list.querySelectorAll('input[type="checkbox"][data-pack]')];
  const progress = document.getElementById('pack-progress');
  const notice = document.getElementById('pack-notice');
  const saved = new Set(readList('tineghir-pack'));
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

document.addEventListener('DOMContentLoaded', initChecklist);
