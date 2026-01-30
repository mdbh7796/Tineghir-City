const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || './tineghir.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        logger.error('Error opening database: ' + err.message);
    } else {
        logger.info('Connected to SQLite database.');
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

        // Messages Table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            message TEXT,
            created_at TEXT
        )`);

        // Seed Default Content if empty
        db.get("SELECT count(*) as count FROM content", (err, row) => {
            if (row && row.count === 0) {
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
                logger.info('Seeded default content.');
            }
        });

        // Seed Attractions if empty
        db.get("SELECT count(*) as count FROM attractions", (err, row) => {
            if (row && row.count === 0) {
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
                logger.info('Seeded default attractions.');
            }
        });

        // Seed Admin User if empty
        db.get("SELECT count(*) as count FROM users", (err, row) => {
            if (row && row.count === 0) {
                bcrypt.hash('password', 10, (err, hash) => {
                    if (err) {
                        logger.error('Error seeding admin: ' + err);
                        return;
                    }
                    db.run("INSERT INTO users (name, email, password, role, status, last_active) VALUES (?, ?, ?, ?, ?, ?)", 
                        ['Admin User', 'admin@tineghir.ma', hash, 'Administrator', 'Active', new Date().toISOString()]);
                    logger.info('Seeded admin user.');
                });
            }
        });
    });
}

module.exports = db;
