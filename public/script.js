// Fetch Content from API
async function loadContent() {
  try {
    const response = await fetch('/api/content');
    if (!response.ok) throw new Error('Failed to load content');
    const config = await response.json();
    applyContent(config);
  } catch (error) {
    console.warn('Using default content due to error:', error);
  }
}

function applyContent(config) {
  if (config.hero_title) document.getElementById('hero-title').textContent = config.hero_title;
  if (config.hero_subtitle) document.getElementById('hero-subtitle').textContent = config.hero_subtitle;
  if (config.about_description) document.getElementById('about-description').textContent = config.about_description;
  if (config.footer_text) document.getElementById('footer-text').textContent = config.footer_text;
  
  // Hero Image (if stored as base64 or URL)
  if (config.hero_image) {
      // Find the hero image element - currently it is the first img in the hero section
      const heroImg = document.querySelector('#home img');
      if(heroImg) heroImg.src = config.hero_image;
  }
}

async function loadAttractions() {
    try {
        const response = await fetch('/api/attractions');
        if (!response.ok) throw new Error('Failed to load attractions');
        const attractions = await response.json();
        
        const grid = document.getElementById('attractions-grid');
        if (!grid) return;
        
        grid.innerHTML = attractions.map((attr, index) => `
          <div class="card-hover bg-white rounded-2xl overflow-hidden shadow-lg group reveal delay-${(index % 3) * 100}">
            <div class="h-48 bg-stone-200 relative overflow-hidden flex items-center justify-center">
              ${attr.image 
                ? `<img src="${attr.image}" alt="${attr.title}" class="w-full h-full object-cover transform group-hover:scale-110 transition-duration-700">`
                : `<div class="text-4xl">📷</div>`
              }
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              ${attr.tag ? `<span class="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">${attr.tag}</span>` : ''}
            </div>
            <div class="p-6">
              <h3 class="font-display text-2xl font-bold text-stone-800 mb-2">${attr.title}</h3>
              <p class="text-stone-600 mb-4">${attr.description}</p>
              <div class="flex items-center text-amber-600 font-medium group-hover:gap-3 transition-all">
                <span>Explore</span>
                <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
            </div>
          </div>
        `).join('');
        
        // Re-init observer for new elements
        initScrollAnimations();
        
    } catch (error) {
        console.error('Error loading attractions:', error);
    }
}

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

// 3. Contact Form Handling
function initContactForm() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      
      // Get form data
      const nameInput = form.querySelector('input[type="text"]');
      const emailInput = form.querySelector('input[type="email"]');
      const messageInput = form.querySelector('textarea');
      
      if (!nameInput || !emailInput || !messageInput) return;

      const formData = {
          name: nameInput.value,
          email: emailInput.value,
          message: messageInput.value
      };

      btn.textContent = 'Sending...';
      btn.disabled = true;

      try {
          const response = await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });

          if (response.ok) {
              btn.textContent = 'Message Sent! ✅';
              btn.classList.add('bg-green-600');
              btn.classList.remove('bg-amber-600', 'hover:bg-amber-500');
              form.reset();
              
              setTimeout(() => {
                  btn.textContent = originalText;
                  btn.classList.remove('bg-green-600');
                  btn.classList.add('bg-amber-600', 'hover:bg-amber-500');
                  btn.disabled = false;
              }, 3000);
          } else {
              throw new Error('Failed to send');
          }
      } catch (error) {
          console.error('Error sending message:', error);
          btn.textContent = 'Error. Try again.';
          btn.classList.add('bg-red-600');
          setTimeout(() => {
              btn.textContent = originalText;
              btn.classList.remove('bg-red-600');
              btn.disabled = false;
          }, 3000);
      }
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
  loadContent();
  loadAttractions();
  initScrollAnimations();
  initLightbox();
  initContactForm();
  initMap();
});
