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
    bar.className = 'consent-banner';
    const msg = document.createElement('p');
    msg.className = 'consent-msg';
    msg.textContent = 'Help improve this guide with anonymous visits? No tracking until you accept.';
    const ok = document.createElement('button');
    ok.type = 'button'; ok.textContent = 'Accept';
    ok.className = 'consent-accept';
    const no = document.createElement('button');
    no.type = 'button'; no.textContent = 'Decline';
    no.className = 'consent-decline';
    ok.addEventListener('click', () => { write('granted'); bar.remove(); });
    no.addEventListener('click', () => { write('denied'); bar.remove(); });
    bar.append(msg, ok, no);
    document.body.appendChild(bar);
  }
  document.addEventListener('DOMContentLoaded', mount);
})();
