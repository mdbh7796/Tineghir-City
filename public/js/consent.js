// Opt-in consent: default deny, no beacons before accept.
// Stores 'tineghir-consent' = 'granted' | 'denied'.
(function () {
  function store() {
    try { return window.localStorage || null; } catch { return null; }
  }
  function read() {
    try { return store() && store().getItem('tineghir-consent'); } catch { return null; }
  }
  function write(v) {
    try { store() && store().setItem('tineghir-consent', v); return true; } catch { return false; }
  }
  function granted() { return read() === 'granted'; }
  if (typeof window !== 'undefined') window.__consent = { granted, read, write };

  function mount() {
    if (read()) return;
    const bar = document.createElement('div');
    bar.id = 'consent-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Privacy consent');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:80;background:#1c1917;color:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:flex;flex-wrap:wrap;gap:12px;align-items:center;';
    const msg = document.createElement('p');
    msg.style.cssText = 'margin:0;flex:1 1 220px;font-size:14px;';
    msg.textContent = 'Help improve this guide with anonymous visits? No tracking until you accept.';
    const ok = document.createElement('button');
    ok.type = 'button'; ok.textContent = 'Accept';
    ok.style.cssText = 'min-height:44px;padding:10px 20px;background:#B45309;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;';
    const no = document.createElement('button');
    no.type = 'button'; no.textContent = 'Decline';
    no.style.cssText = 'min-height:44px;padding:10px 20px;background:transparent;color:#fcd34d;border:1px solid #B45309;border-radius:8px;font-weight:600;cursor:pointer;';
    ok.addEventListener('click', () => { write('granted'); bar.remove(); });
    no.addEventListener('click', () => { write('denied'); bar.remove(); });
    bar.append(msg, ok, no);
    document.body.appendChild(bar);
  }
  document.addEventListener('DOMContentLoaded', mount);
})();
