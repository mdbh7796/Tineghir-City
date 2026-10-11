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
