// Mock Data
const defaultUsers = [
    { id: 1, name: 'Admin User', email: 'admin@tineghir.ma', role: 'Administrator', status: 'Active', lastActive: 'Now' },
    { id: 2, name: 'Editor Sarah', email: 'sarah@tineghir.ma', role: 'Editor', status: 'Active', lastActive: '2 hours ago' },
    { id: 3, name: 'Guest Guide', email: 'guide@tineghir.ma', role: 'Viewer', status: 'Inactive', lastActive: '3 days ago' }
];

// Login Handling
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    
    btn.innerText = 'Verifying...';
    
    // Simulate API call
    setTimeout(() => {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-layout').classList.remove('hidden');
        initDashboard();
    }, 800);
});

document.getElementById('logout-btn').addEventListener('click', () => {
    if(confirm('Are you sure you want to sign out?')) {
        window.location.reload();
    }
});

// Tab Navigation
window.showTab = function(tabName) {
    // Update Nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        if(btn.innerText.toLowerCase().includes(tabName)) {
            btn.classList.add('bg-stone-800', 'text-amber-500');
        } else {
            btn.classList.remove('bg-stone-800', 'text-amber-500');
        }
    });

    // Update Content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    // Update Title
    const titles = {
        'dashboard': 'Dashboard',
        'content': 'Content Editor',
        'users': 'User Management'
    };
    document.getElementById('page-title').innerText = titles[tabName];
};

// Dashboard Initialization
function initDashboard() {
    initCharts();
    loadContentValues();
    renderUsers();
}

// Chart.js Setup
function initCharts() {
    const ctx1 = document.getElementById('trafficChart').getContext('2d');
    new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Visitors',
                data: [120, 190, 300, 250, 280, 450, 400],
                borderColor: '#d97706', // Amber-600
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    const ctx2 = document.getElementById('deviceChart').getContext('2d');
    new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Mobile', 'Desktop', 'Tablet'],
            datasets: [{
                data: [65, 30, 5],
                backgroundColor: ['#d97706', '#44403c', '#a8a29e'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { 
                legend: { position: 'bottom' } 
            }
        }
    });
}

// Content Editor Logic
function loadContentValues() {
    // Try to load from localStorage, else use defaults mock
    const savedConfig = JSON.parse(localStorage.getItem('siteConfig')) || {
        hero_title: 'Tineghir',
        hero_subtitle: 'Gateway to the Majestic Todra Gorge',
        about_description: 'Nestled at the foot of the High Atlas Mountains...'
    };

    document.getElementById('edit-hero-title').value = savedConfig.hero_title;
    document.getElementById('edit-hero-subtitle').value = savedConfig.hero_subtitle;
    document.getElementById('edit-about-desc').value = savedConfig.about_description;
    
    // Load saved image if exists
    if(savedConfig.hero_image) {
        const preview = document.getElementById('hero-preview');
        const placeholder = document.getElementById('upload-placeholder');
        preview.src = savedConfig.hero_image;
        preview.classList.remove('hidden');
        placeholder.classList.add('hidden');
    }
}

// Image Upload Handler
document.getElementById('hero-image-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('hero-preview');
            const placeholder = document.getElementById('upload-placeholder');
            
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
            
            // Store the base64 string in a temporary variable to be saved on submit
            window.tempHeroImage = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

document.getElementById('content-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get existing config to merge
    const existingConfig = JSON.parse(localStorage.getItem('siteConfig')) || {};

    const newConfig = {
        ...existingConfig,
        hero_title: document.getElementById('edit-hero-title').value,
        hero_subtitle: document.getElementById('edit-hero-subtitle').value,
        about_description: document.getElementById('edit-about-desc').value,
        // Save image if a new one was uploaded, otherwise keep existing
        hero_image: window.tempHeroImage || existingConfig.hero_image
    };

    localStorage.setItem('siteConfig', JSON.stringify(newConfig));
    
    // Feedback
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = 'Saved! ✅';
    btn.classList.add('bg-green-600');
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-green-600');
    }, 2000);
});

// User Management Logic
function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = defaultUsers.map(user => `
        <tr class="hover:bg-stone-50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold text-xs">
                        ${user.name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-medium text-stone-900">${user.name}</div>
                        <div class="text-stone-500 text-xs">${user.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
                    ${user.role}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${user.status}
                </span>
            </td>
            <td class="px-6 py-4 text-stone-500 text-sm">${user.lastActive}</td>
            <td class="px-6 py-4 text-right">
                <button class="text-stone-400 hover:text-amber-600 mx-1">✏️</button>
                <button onclick="deleteUser(${user.id})" class="text-stone-400 hover:text-red-600 mx-1">🗑️</button>
            </td>
        </tr>
    `).join('');
}

window.addNewUser = function() {
    alert('Add User modal would open here.');
};

window.deleteUser = function(id) {
    if(confirm('Delete this user?')) {
        const index = defaultUsers.findIndex(u => u.id === id);
        if (index > -1) {
            defaultUsers.splice(index, 1);
            renderUsers();
        }
    }
};
