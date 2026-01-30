const db = require('../config/database');

exports.getAllAttractions = (req, res) => {
    db.all("SELECT * FROM attractions", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.addAttraction = (req, res) => {
    const { title, description, image, tag } = req.body;
    db.run("INSERT INTO attractions (title, description, image, tag) VALUES (?, ?, ?, ?)", 
        [title, description, image, tag], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
};

exports.deleteAttraction = (req, res) => {
    db.run("DELETE FROM attractions WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
