const db = require('../config/database');

exports.sendMessage = (req, res) => {
    const { name, email, message } = req.body;
    
    // Basic backend validation
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const stmt = db.prepare("INSERT INTO messages (name, email, message, created_at) VALUES (?, ?, ?, ?)");
    const createdAt = new Date().toISOString();

    stmt.run(name, email, message, createdAt, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to save message' });
        }
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
};

exports.getMessages = (req, res) => {
    db.all("SELECT * FROM messages ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};
