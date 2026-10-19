// 2. Gallery Lightbox: accessible dialog with focus trap, focus return,
// prev/next (buttons + arrow keys), scroll lock, and dynamic alt/caption.
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  // Gallery-only widget: no triggers and no modal on other pages.
  if (!lightbox || !document.querySelector('.lightbox-trigger')) return;
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const caption = document.getElementById('lightbox-caption');
  if (!lightboxImg || !closeBtn) return;

  const triggers = [...document.querySelectorAll('.lightbox-trigger')];
  const slides = triggers.map((item) => {
    const img = item.querySelector('img');
    const heading = item.querySelector('h2, h3');
    const src = item.getAttribute('data-lightbox-src')
      || item.getAttribute('href')
      || (img && img.src)
      || '';
    return {
      src,
      alt: (img && img.alt) || (heading && heading.textContent.trim()) || 'Gallery photo',
    };
  });
  if (!slides.length) return;

  let index = 0;
  let returnFocus = null;
  let closeTimer = null;

  const show = (i) => {
    index = (i + slides.length) % slides.length;
    const slide = slides[index];
    if (slide.src) lightboxImg.src = slide.src;
    lightboxImg.alt = slide.alt;
    if (caption) caption.textContent = slide.alt;
    // Preload neighbours so paging feels instant.
    [index - 1, index + 1].forEach((n) => {
      const s = slides[(n + slides.length) % slides.length];
      if (s && s.src && s.src !== slide.src) new Image().src = s.src;
    });
  };

  const focusables = () => [...lightbox.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.getClientRects().length > 0);

  const open = (i, opener) => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    returnFocus = opener || document.activeElement;
    show(i);
    lightbox.classList.add('is-open');
    document.body.classList.add('lightbox-open');
    // Let display:flex apply before transitioning opacity/scale.
    requestAnimationFrame(() => {
      lightbox.classList.remove('opacity-0');
      lightboxImg.classList.remove('scale-95');
    });
    closeBtn.focus();
  };

  const close = () => {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.add('opacity-0');
    lightboxImg.classList.add('scale-95');
    document.body.classList.remove('lightbox-open');
    // Return focus immediately so keyboard users are not stranded.
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
    returnFocus = null;
    closeTimer = setTimeout(() => {
      lightbox.classList.remove('is-open');
      lightboxImg.src = '';
      lightboxImg.alt = '';
      if (caption) caption.textContent = '';
      closeTimer = null;
    }, 300); // Match transition duration
  };

  const step = (dir) => show(index + dir);

  triggers.forEach((item, i) => {
    item.addEventListener('click', (e) => {
      // Keep modified/middle clicks as normal navigation to the image file.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      open(i, item);
    });
  });

  closeBtn.addEventListener('click', close);
  if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => step(1));

  // Close on background click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
      return;
    }
    if (e.key !== 'Tab') return;
    // Focus trap: cycle within the dialog while open.
    const list = focusables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// Pins must be checked in Google Maps before release.
