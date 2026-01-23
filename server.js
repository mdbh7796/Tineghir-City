const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3000;
const DB_PATH = './tineghir.db';

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Unique filename: timestamp + original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.static('.')); // Serve static files from root
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Database Initialization
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Content Table
        db.run(`CREATE TABLE IF NOT EXISTS content (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        // Attractions Table
        db.run(`CREATE TABLE IF NOT EXISTS attractions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            image TEXT,
            tag TEXT
        )`);

        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            status TEXT,
            last_active TEXT
        )`);

        // Seed Default Content if empty
        db.get("SELECT count(*) as count FROM content", (err, row) => {
            if (row.count === 0) {
                const defaultContent = {
                    hero_title: 'Tineghir',
                    hero_subtitle: 'Gateway to the Majestic Todra Gorge',
                    about_description: 'Nestled at the foot of the High Atlas Mountains, Tineghir is an enchanting oasis city that has captivated travelers for centuries. This ancient Berber settlement sits along the legendary Route of a Thousand Kasbahs, offering a window into Morocco\'s rich cultural heritage.',
                    footer_text: 'Discover the magic of Southern Morocco. Where ancient traditions meet breathtaking natural beauty.'
                };
                
                const stmt = db.prepare("INSERT INTO content (key, value) VALUES (?, ?)");
                Object.entries(defaultContent).forEach(([key, value]) => {
                    stmt.run(key, value);
                });
                stmt.finalize();
                console.log('Seeded default content.');
            }
        });

        // Seed Attractions if empty
        db.get("SELECT count(*) as count FROM attractions", (err, row) => {
            if (row.count === 0) {
                const defaultAttractions = [
                    { title: 'Todra Gorge', description: 'A spectacular canyon with 300-meter high walls, perfect for hiking, rock climbing, and photography.', image: 'images/todra-gorge.jpg', tag: 'Featured' },
                    { title: 'Palm Groves', description: 'Lush green oasis stretching 25km along the Todra River, home to traditional Berber villages.', image: 'images/tineghir-palm-grove.jpg', tag: 'Discover' },
                    { title: 'Ancient Kasbahs', description: 'Explore centuries-old fortified villages built from red clay, showcasing traditional Berber architecture.', image: 'images/ait-benhaddou.jpg', tag: 'Visit' },
                    { title: 'Berber Markets', description: 'Vibrant souks filled with handwoven carpets, silver jewelry, spices, and traditional crafts.', image: '', tag: 'Shop' },
                    { title: 'Desert Excursions', description: 'Camel treks, 4x4 adventures, and overnight camping under the Saharan stars.', image: 'images/merzouga-dunes.jpg', tag: 'Adventure' },
                    { title: 'Local Cuisine', description: 'Savor traditional tagines, couscous, mint tea, and fresh dates from the palm groves.', image: 'images/moroccan-tagine.jpg', tag: 'Taste' }
                ];
                
                const stmt = db.prepare("INSERT INTO attractions (title, description, image, tag) VALUES (?, ?, ?, ?)");
                defaultAttractions.forEach(attr => {
                    stmt.run(attr.title, attr.description, attr.image, attr.tag);
                });
                stmt.finalize();
                console.log('Seeded default attractions.');
            }
        });

        // Seed Admin User if empty
        db.get("SELECT count(*) as count FROM users", (err, row) => {
            if (row.count === 0) {
                const hash = bcrypt.hashSync('password', 10);
                db.run("INSERT INTO users (name, email, password, role, status, last_active) VALUES (?, ?, ?, ?, ?, ?)", 
                    ['Admin User', 'admin@tineghir.ma', hash, 'Administrator', 'Active', new Date().toISOString()]);
                console.log('Seeded admin user.');
            }
        });
    });
}

// --- API Endpoints ---

// File Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the path relative to the server root, accessible via the static middleware
    res.json({ filePath: 'uploads/' + req.file.filename });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'User not found' });

        if (bcrypt.compareSync(password, user.password)) {
            // Update last active
            db.run("UPDATE users SET last_active = ? WHERE id = ?", [new Date().toISOString(), user.id]);
            
            // Return user info (excluding password)
            const { password, ...userWithoutPass } = user;
            res.json({ success: true, user: userWithoutPass });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    });
});

// Get All Content
app.get('/api/content', (req, res) => {
    db.all("SELECT key, value FROM content", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const content = {};
        rows.forEach(row => {
            content[row.key] = row.value;
        });
        res.json(content);
    });
});

// Update Content
app.post('/api/content', (req, res) => {
    const updates = req.body;
    const stmt = db.prepare("INSERT INTO content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        try {
            Object.entries(updates).forEach(([key, value]) => {
                stmt.run(key, value);
            });
            db.run("COMMIT");
            stmt.finalize();
            res.json({ success: true });
        } catch (error) {
            db.run("ROLLBACK");
            res.status(500).json({ error: error.message });
        }
    });
});

// --- Attractions API ---

app.get('/api/attractions', (req, res) => {
    db.all("SELECT * FROM attractions", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/attractions', (req, res) => {
    const { title, description, image, tag } = req.body;
    db.run("INSERT INTO attractions (title, description, image, tag) VALUES (?, ?, ?, ?)", 
        [title, description, image, tag], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.delete('/api/attractions/:id', (req, res) => {
    db.run("DELETE FROM attractions WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get Users
app.get('/api/users', (req, res) => {
    db.all("SELECT id, name, email, role, status, last_active FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add User
app.post('/api/users', (req, res) => {
    const { name, email, password, role } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const status = 'Active';
    const lastActive = 'Never';

    db.run("INSERT INTO users (name, email, password, role, status, last_active) VALUES (?, ?, ?, ?, ?, ?)", 
        [name, email, hash, role, status, lastActive], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Delete User
app.delete('/api/users/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
