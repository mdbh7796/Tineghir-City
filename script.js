const defaultConfig = {
  hero_title: 'Tineghir',
  hero_subtitle: 'Gateway to the Majestic Todra Gorge',
  about_title: 'The Jewel of Southern Morocco',
  about_description: 'Nestled at the foot of the High Atlas Mountains, Tineghir is an enchanting oasis city that has captivated travelers for centuries. This ancient Berber settlement sits along the legendary Route of a Thousand Kasbahs, offering a window into Morocco\'s rich cultural heritage.',
  attractions_title: 'Must-See Attractions',
  footer_text: 'Discover the magic of Southern Morocco. Where ancient traditions meet breathtaking natural beauty.',
  background_color: '#1C1917',
  surface_color: '#FFFFFF',
  text_color: '#44403C',
  primary_action_color: '#D97706',
  secondary_action_color: '#B45309'
};

async function onConfigChange(config) {
  document.getElementById('hero-title').textContent = config.hero_title || defaultConfig.hero_title;
  document.getElementById('hero-subtitle').textContent = config.hero_subtitle || defaultConfig.hero_subtitle;
  document.getElementById('about-title').textContent = config.about_title || defaultConfig.about_title;
  document.getElementById('about-description').textContent = config.about_description || defaultConfig.about_description;
  document.getElementById('attractions-title').textContent = config.attractions_title || defaultConfig.attractions_title;
  document.getElementById('footer-text').textContent = config.footer_text || defaultConfig.footer_text;
  
  // Apply colors
  const bgColor = config.background_color || defaultConfig.background_color;
  const surfaceColor = config.surface_color || defaultConfig.surface_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const primaryAction = config.primary_action_color || defaultConfig.primary_action_color;
  const secondaryAction = config.secondary_action_color || defaultConfig.secondary_action_color;
  
  document.documentElement.style.setProperty('--bg-color', bgColor);
  document.documentElement.style.setProperty('--surface-color', surfaceColor);
  document.documentElement.style.setProperty('--text-color', textColor);
  document.documentElement.style.setProperty('--primary-action', primaryAction);
  document.documentElement.style.setProperty('--secondary-action', secondaryAction);
}

function mapToCapabilities(config) {
  return {
    recolorables: [
      {
        get: () => config.background_color || defaultConfig.background_color,
        set: (value) => { config.background_color = value; window.elementSdk.setConfig({ background_color: value }); }
      },
      {
        get: () => config.surface_color || defaultConfig.surface_color,
        set: (value) => { config.surface_color = value; window.elementSdk.setConfig({ surface_color: value }); }
      },
      {
        get: () => config.text_color || defaultConfig.text_color,
        set: (value) => { config.text_color = value; window.elementSdk.setConfig({ text_color: value }); }
      },
      {
        get: () => config.primary_action_color || defaultConfig.primary_action_color,
        set: (value) => { config.primary_action_color = value; window.elementSdk.setConfig({ primary_action_color: value }); }
      },
      {
        get: () => config.secondary_action_color || defaultConfig.secondary_action_color,
        set: (value) => { config.secondary_action_color = value; window.elementSdk.setConfig({ secondary_action_color: value }); }
      }
    ],
    borderables: [],
    fontEditable: undefined,
    fontSizeable: undefined
  };
}

function mapToEditPanelValues(config) {
  return new Map([
    ['hero_title', config.hero_title || defaultConfig.hero_title],
    ['hero_subtitle', config.hero_subtitle || defaultConfig.hero_subtitle],
    ['about_title', config.about_title || defaultConfig.about_title],
    ['about_description', config.about_description || defaultConfig.about_description],
    ['attractions_title', config.attractions_title || defaultConfig.attractions_title],
    ['footer_text', config.footer_text || defaultConfig.footer_text]
  ]);
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
  
  // Select all elements that should trigger lightbox (updated to be broader)
  // We look for elements inside the gallery section specifically, or marked with .lightbox-trigger
  const galleryItems = document.querySelectorAll('#gallery .rounded-2xl, .lightbox-trigger');

  galleryItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      // Find an image or SVG inside the clicked item
      // For placeholder SVGs that are backgrounds, this might need tweaking, 
      // but for now we look for <img> tags first.
      
      // Check for image tag
      const img = item.querySelector('img');
      let src = '';
      
      if (img) {
         src = img.src;
      } else {
         // Fallback for CSS background gradients/SVGs in the gallery
         // Since we don't have real images there yet, we'll use a placeholder logic
         // checking the text content to map to our new SVGs.
         const text = item.innerText.toLowerCase();
         if (text.includes('todra')) src = 'images/todra-gorge.svg';
         else if (text.includes('palm')) src = 'images/tineghir-palm-grove.svg';
         else if (text.includes('crafts')) src = 'images/ait-benhaddou.svg'; // Reuse kasbah/craft style
         else if (text.includes('water')) src = 'images/todra-gorge.svg'; // Reuse gorge
         else if (text.includes('desert')) src = 'images/merzouga-dunes.svg';
         else if (text.includes('kasbah')) src = 'images/ait-benhaddou.svg';
         else return; // Don't open if we can't determine image
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      
      btn.textContent = 'Message Sent! ✅';
      btn.classList.add('bg-green-600');
      btn.classList.remove('bg-amber-600', 'hover:bg-amber-500');
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-amber-600', 'hover:bg-amber-500');
        form.reset();
      }, 3000);
    });
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initLightbox();
  initContactForm();
});

// Initialize SDK
if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig,
    onConfigChange,
    mapToCapabilities,
    mapToEditPanelValues
  });
}