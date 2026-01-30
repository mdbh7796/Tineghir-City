const db = require('../config/database');

exports.getAllContent = (req, res) => {
    db.all("SELECT key, value FROM content", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const content = {};
        rows.forEach(row => {
            content[row.key] = row.value;
        });
        res.json(content);
    });
};

exports.updateContent = (req, res) => {
    const updates = req.body;
    const stmt = db.prepare("INSERT INTO content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    
    const promises = Object.entries(updates).map(([key, value]) => {
        return new Promise((resolve, reject) => {
            stmt.run(key, value, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    Promise.all(promises)
        .then(() => {
            stmt.finalize();
            res.json({ success: true });
        })
        .catch(error => {
            stmt.finalize();
            res.status(500).json({ error: error.message });
        });
};
