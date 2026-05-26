
// Mobile menu toggle
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('#mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.remove('active');
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

// 3. Initialize Leaflet Map
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  const attractions = [
    { name: 'Tineghir City Center', lat: 31.5139, lng: -5.5316,
      desc: 'Gateway to Todra Gorge', imgUrl: 'images/hero-tineghir.jpg' },
    { name: 'Todra Gorge', lat: 31.58395, lng: -5.59161,
      desc: 'Towering 300m canyon walls, hiking & climbing', imgUrl: 'images/todra-gorge.jpg' },
    { name: 'Palm Grove', lat: 31.5200, lng: -5.5300,
      desc: 'Lush oasis with date palms along the Todra River', imgUrl: 'images/tineghir-palm-grove.jpg' },
    { name: 'Traditional Souks', lat: 31.5100, lng: -5.5310,
      desc: 'Handicrafts, carpets, silver jewelry & spices', imgUrl: 'images/gallery-crafts.jpg' },
    { name: 'Kasbah El Glaoui', lat: 31.5110, lng: -5.5300,
      desc: 'Historic mud-brick kasbah in the city center', imgUrl: 'images/about-tineghir.jpg' },
    { name: 'Medina of Tineghir', lat: 31.5120, lng: -5.5320,
      desc: 'Old medina with Berber architecture & narrow alleys', imgUrl: 'images/gallery-palms.jpg' },
  ];

  const map = L.map('map').setView([31.5139, -5.5316], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  attractions.forEach(a => {
    L.marker([a.lat, a.lng]).addTo(map)
      .bindPopup(`
        <b>${a.name}</b><br>
        <img src="${a.imgUrl}" alt="${a.name}" style="width:200px;height:120px;object-fit:cover;border-radius:8px;margin:6px 0">
        <p style="margin:0;font-size:13px;color:#555">${a.desc}</p>
      `);
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initLightbox();
  initMap();
});
