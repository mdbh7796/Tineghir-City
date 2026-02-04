
// Mobile menu toggle
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
});

// Close mobile menu when clicking a link
document.querySelectorAll('#mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.add('hidden');
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

// 3. Contact Form Handling (mailto fallback for static site)
function initContactForm() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = form.querySelector('input[type="text"]');
      const emailInput = form.querySelector('input[type="email"]');
      const messageInput = form.querySelector('textarea');
      
      if (!nameInput || !emailInput || !messageInput) return;

      const subject = encodeURIComponent(`Message from ${nameInput.value}`);
      const body = encodeURIComponent(`Name: ${nameInput.value}\nEmail: ${emailInput.value}\n\nMessage:\n${messageInput.value}`);
      
      window.location.href = `mailto:info@tineghir.ma?subject=${subject}&body=${body}`;
      
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Opening email client...';
      
      setTimeout(() => {
        btn.textContent = originalText;
        form.reset();
      }, 2000);
    });
  });
}

// 4. Initialize Leaflet Map
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Coordinates for Tineghir, Morocco
  const lat = 31.5139;
  const lng = -5.5316;

  const map = L.map('map').setView([lat, lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.marker([lat, lng]).addTo(map)
      .bindPopup('<b>Welcome to Tineghir</b><br>Gateway to Todra Gorge.')
      .openPopup();
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initLightbox();
  initContactForm();
  initMap();
});
