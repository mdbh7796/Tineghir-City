const bcrypt = require('bcrypt');
const db = require('../config/database');

exports.login = (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'User not found' });

        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                // Update last active
                db.run("UPDATE users SET last_active = ? WHERE id = ?", [new Date().toISOString(), user.id]);
                
                // Return user info (excluding password)
                const { password, ...userWithoutPass } = user;
                
                // Set session
                req.session.user = userWithoutPass;
                
                res.json({ success: true, user: userWithoutPass });
            } else {
                res.status(401).json({ error: 'Invalid password' });
            }
        } catch (bcryptErr) {
            res.status(500).json({ error: 'Authentication error' });
        }
    });
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true });
    });
};

exports.me = (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
};
