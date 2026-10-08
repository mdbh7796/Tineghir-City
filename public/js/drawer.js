// Slide-in drawer: open/close, backdrop + Escape, Tab focus trap,
// focus return, and pathname-based active link. Null-safe so pages
// without drawer markup never throw.
function openDrawer() {
  const drawer = document.getElementById('site-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const btn = document.getElementById('mobile-menu-btn');
  if (!drawer || !btn) return;
  document.body.classList.add('drawer-open');
  if (backdrop) backdrop.hidden = false;
  drawer.setAttribute('aria-hidden', 'false');
  btn.setAttribute('aria-expanded', 'true');
  btn.setAttribute('aria-label', 'Close menu');
  const firstLink = drawer.querySelector('a, button');
  if (firstLink) firstLink.focus();
}

function closeDrawer(refocus = false) {
  const drawer = document.getElementById('site-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const btn = document.getElementById('mobile-menu-btn');
  if (!drawer || !btn || !document.body.classList.contains('drawer-open')) return;
  document.body.classList.remove('drawer-open');
  if (backdrop) backdrop.hidden = true;
  drawer.setAttribute('aria-hidden', 'true');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Open menu');
  if (refocus) btn.focus();
}

function isDrawerOpen() {
  return document.body.classList.contains('drawer-open');
}

function initDrawer() {
  const drawer = document.getElementById('site-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const btn = document.getElementById('mobile-menu-btn');
  if (!drawer || !btn) return;

  btn.addEventListener('click', () => {
    if (isDrawerOpen()) closeDrawer(false);
    else openDrawer();
  });

  const closeBtn = document.getElementById('drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', () => closeDrawer(true));
  if (backdrop) backdrop.addEventListener('click', () => closeDrawer(false));

  document.addEventListener('keydown', (e) => {
    if (!isDrawerOpen()) return;
    if (e.key === 'Escape') {
      closeDrawer(true);
      return;
    }
    // Tab focus trap: cycle within the drawer while open.
    if (e.key === 'Tab') {
      const focusable = drawer.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Closing the drawer when a link is chosen (navigation follows).
  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeDrawer(false));
  });

  // Active link from the current page path (replaces scrollspy anchors).
  const page = document.body.dataset.page
    || (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '')
    || 'index';
  document.querySelectorAll('[data-page]').forEach((link) => {
    if (link.dataset.page === page) link.classList.add('nav-active');
    else link.classList.remove('nav-active');
  });
}

if (typeof window !== 'undefined') {
  window.__drawer = { openDrawer, closeDrawer, isDrawerOpen };
}

document.addEventListener('DOMContentLoaded', initDrawer);
