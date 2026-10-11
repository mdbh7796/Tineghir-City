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

