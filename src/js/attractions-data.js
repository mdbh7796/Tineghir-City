const ATTRACTIONS = {
  'tineghir-center': { name: 'Tineghir City Center', lat: 31.5139, lng: -5.5316, kind: 'point', verified: true,
    desc: 'Gateway to Todra Gorge', imgUrl: 'images/hero-tineghir.jpg' },
  'todra-gorge': { name: 'Todra Gorge', lat: 31.58395, lng: -5.59161, kind: 'point', verified: true,
    desc: 'Towering 300m canyon walls, hiking & climbing', imgUrl: 'images/todra-gorge.jpg' },
  'palm-grove': { name: 'Palm Grove', lat: 31.5205, lng: -5.5302, kind: 'point', verified: true,
    desc: 'Lush oasis with date palms along the Todra River', imgUrl: 'images/tineghir-palm-grove.jpg' },
  'souks': { name: 'Traditional Souks', lat: 31.5125, lng: -5.5330, kind: 'point', verified: true,
    desc: 'Handicrafts, carpets, silver jewelry & spices', imgUrl: 'images/gallery-crafts.jpg' },
  'kasbah-el-glaoui': { name: 'Kasbah El Glaoui', lat: 31.5248, lng: -5.5312, kind: 'point', verified: true,
    desc: 'Historic mud-brick kasbah in the city center', imgUrl: 'images/about-tineghir.jpg' },
  'medina': { name: 'Medina of Tineghir', lat: 31.5147, lng: -5.5328, kind: 'point', verified: true,
    desc: 'Old medina with Berber architecture & narrow alleys', imgUrl: 'images/gallery-palms.jpg' },
  'todra-villages': { name: 'Todra Valley Villages', lat: 31.5450, lng: -5.5560, kind: 'area', verified: true,
    desc: 'Berber villages and terraced plots up Tinghir valley', imgUrl: 'images/gallery-palms.jpg' },
};

// Card headings as written in index.html -> table keys.
const CARD_TITLES = {
  'Todra Gorge': 'todra-gorge',
  'Palm Grove (Palmerie)': 'palm-grove',
  'Kasbah El Glaoui': 'kasbah-el-glaoui',
  'Traditional Souks': 'souks',
  'Medina of Tineghir': 'medina',
  'Todra Valley Villages': 'todra-villages',
};

// Planner (tools page) reads names through this handle instead of a copy.
if (typeof window !== 'undefined') {
  window.__attractions = ATTRACTIONS;
}

function cardAttractionId(card) {
  if (card.dataset.attraction) return card.dataset.attraction;
  const h3 = card.querySelector('h3');
  const id = h3 ? CARD_TITLES[h3.textContent.trim()] : undefined;
  if (id) card.dataset.attraction = id;
  return id;
}

