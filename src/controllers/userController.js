const db = require('../config/database');
const bcrypt = require('bcrypt');

exports.getAllUsers = (req, res) => {
    db.all("SELECT id, name, email, role, status, last_active FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.addUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const status = 'Active';
        const lastActive = 'Never';

        db.run("INSERT INTO users (name, email, password, role, status, last_active) VALUES (?, ?, ?, ?, ?, ?)", 
            [name, email, hash, role, status, lastActive], 
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
};

exports.deleteUser = (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
