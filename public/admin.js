// Global state
let currentUser = null;

// Check session on load
document.addEventListener('DOMContentLoaded', checkSession);

async function checkSession() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboard();
        }
    } catch (error) {
        console.log('Not logged in');
    }
}

function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-layout').classList.remove('hidden');
    initDashboard();
}

// Login Handling
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const emailInput = e.target.querySelector('input[type="email"]');
    const passwordInput = e.target.querySelector('input[type="password"]');
    
    const originalText = btn.innerText;
    btn.innerText = 'Verifying...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            showDashboard();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Connection error. Is the server running?');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    if(confirm('Are you sure you want to sign out?')) {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.reload(); // Force reload anyway
        }
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
        'attractions': 'Manage Attractions',
        'users': 'User Management'
    };
    document.getElementById('page-title').innerText = titles[tabName];
};

// Dashboard Initialization
function initDashboard() {
    initCharts();
    loadContentValues();
    loadAdminAttractions();
    loadUsers();
}

// Chart.js Setup (Keep static for now, or fetch real stats if implemented)
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

// --- Content Editor Logic ---

async function loadContentValues() {
    try {
        const response = await fetch('/api/content');
        if (response.status === 401) return window.location.reload();
        const config = await response.json();

        if (config.hero_title) document.getElementById('edit-hero-title').value = config.hero_title;
        if (config.hero_subtitle) document.getElementById('edit-hero-subtitle').value = config.hero_subtitle;
        if (config.about_description) document.getElementById('edit-about-desc').value = config.about_description;
        
        // Load saved image if exists
        if(config.hero_image) {
            const preview = document.getElementById('hero-preview');
            const placeholder = document.getElementById('upload-placeholder');
            preview.src = config.hero_image;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Image Upload Handler
document.getElementById('hero-image-upload').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Show loading state
            const preview = document.getElementById('hero-preview');
            const placeholder = document.getElementById('upload-placeholder');
            placeholder.innerHTML = '<span class="text-2xl animate-spin">⏳</span><p class="text-xs text-stone-500 mt-1">Uploading...</p>';
            placeholder.classList.remove('hidden');
            preview.classList.add('hidden');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (response.status === 401) {
                alert('Session expired');
                return window.location.reload();
            }
            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            
            // Update preview
            preview.src = data.filePath;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
            
            // Store the server path to be saved on submit
            window.tempHeroImage = data.filePath;

        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
            document.getElementById('upload-placeholder').innerHTML = '<span class="text-2xl">⚠️</span><p class="text-xs text-stone-500 mt-1">Error</p>';
        }
    }
});

document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updates = {
        hero_title: document.getElementById('edit-hero-title').value,
        hero_subtitle: document.getElementById('edit-hero-subtitle').value,
        about_description: document.getElementById('edit-about-desc').value
    };

    // Only update image if changed
    if (window.tempHeroImage) {
        updates.hero_image = window.tempHeroImage;
    }

    try {
        const response = await fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (response.status === 401) {
             alert('Session expired');
             return window.location.reload();
        }

        if (response.ok) {
            // Feedback
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Saved! ✅';
            btn.classList.add('bg-green-600');
            
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('bg-green-600');
            }, 2000);
        } else {
            alert('Failed to save content');
        }
    } catch (error) {
        console.error('Error saving content:', error);
        alert('Error saving content');
    }
});

// --- User Management Logic ---

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (response.status === 401) return; 
        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = users.map(user => `
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
            <td class="px-6 py-4 text-stone-500 text-sm">
                ${user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="deleteUser(${user.id})" class="text-stone-400 hover:text-red-600 mx-1">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// User Modal Logic
window.addNewUser = function() {
    document.getElementById('user-modal').classList.remove('hidden');
};

window.closeUserModal = function() {
    document.getElementById('user-modal').classList.add('hidden');
    document.getElementById('add-user-form').reset();
};

document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.role = 'Editor'; // Default role

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.status === 401) {
            alert('Session expired');
            return window.location.reload();
        }

        if (response.ok) {
            loadUsers(); // Reload table
            closeUserModal();
        } else {
            alert('Failed to add user');
        }
    } catch (error) {
        console.error('Error adding user:', error);
    }
});

window.deleteUser = async function(id) {
    if(confirm('Delete this user?')) {
        try {
            const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (response.status === 401) return window.location.reload();
            if (response.ok) {
                loadUsers(); // Reload table
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }
};

// --- Attraction Management Logic ---

async function loadAdminAttractions() {
    try {
        const response = await fetch('/api/attractions'); // Public endpoint, but safe to call
        const attractions = await response.json();
        
        const grid = document.getElementById('admin-attractions-grid');
        grid.innerHTML = attractions.map(attr => `
            <div class="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden group relative">
                <div class="h-40 bg-stone-100 relative">
                    ${attr.image 
                        ? `<img src="${attr.image}" class="w-full h-full object-cover">`
                        : `<div class="w-full h-full flex items-center justify-center text-3xl">📷</div>`
                    }
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onclick="deleteAttraction(${attr.id})" class="bg-red-600 text-white p-2 rounded-full hover:bg-red-500 transition-colors" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-stone-800">${attr.title}</h4>
                        ${attr.tag ? `<span class="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">${attr.tag}</span>` : ''}
                    </div>
                    <p class="text-sm text-stone-500 line-clamp-2">${attr.description}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading attractions:', error);
    }
}

window.addNewAttraction = function() {
    document.getElementById('attraction-modal').classList.remove('hidden');
};

window.closeAttractionModal = function() {
    document.getElementById('attraction-modal').classList.add('hidden');
    document.getElementById('add-attraction-form').reset();
};

document.getElementById('add-attraction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    btn.innerText = 'Saving...';
    btn.disabled = true;

    try {
        let imagePath = '';
        const imageFile = formData.get('image');
        
        // Upload image if present
        if (imageFile && imageFile.size > 0) {
            const uploadData = new FormData();
            uploadData.append('image', imageFile);
            
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            });
            
            if (uploadRes.status === 401) {
                alert('Session expired');
                return window.location.reload();
            }
            if (!uploadRes.ok) throw new Error('Image upload failed');
            const uploadJson = await uploadRes.json();
            imagePath = uploadJson.filePath;
        }

        // Add Attraction
        const attractionData = {
            title: formData.get('title'),
            description: formData.get('description'),
            tag: formData.get('tag'),
            image: imagePath
        };

        const response = await fetch('/api/attractions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attractionData)
        });
        
        if (response.status === 401) return window.location.reload();

        if (response.ok) {
            loadAdminAttractions();
            closeAttractionModal();
        } else {
            alert('Failed to add attraction');
        }
    } catch (error) {
        console.error('Error adding attraction:', error);
        alert('Error adding attraction');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

window.deleteAttraction = async function(id) {
    if(confirm('Delete this attraction?')) {
        try {
            const response = await fetch(`/api/attractions/${id}`, { method: 'DELETE' });
            if (response.status === 401) return window.location.reload();
            if (response.ok) {
                loadAdminAttractions();
            } else {
                alert('Failed to delete attraction');
            }
        } catch (error) {
            console.error('Error deleting attraction:', error);
        }
    }
};