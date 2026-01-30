require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authenticate = require('./src/middleware/authMiddleware');
const logger = require('./src/utils/logger');

// Route Imports
const authRoutes = require('./src/routes/authRoutes');
const contentRoutes = require('./src/routes/contentRoutes');
const attractionRoutes = require('./src/routes/attractionRoutes');
const userRoutes = require('./src/routes/userRoutes');
const messageRoutes = require('./src/routes/messageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Unique filename: timestamp + original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- Security Middleware ---

// Helmet: Secure HTTP Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.openstreetmap.org"],
            connectSrc: ["'self'"],
        },
    },
}));

// Global Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// --- General Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// --- Routes ---
app.use('/api', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/attractions', attractionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// File Upload Endpoint (Kept in server.js for now due to multer dependency)
app.post('/api/upload', authenticate, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ filePath: 'uploads/' + req.file.filename });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`Server running at http://localhost:${PORT}`);
        logger.info(`Admin panel: http://localhost:${PORT}/admin.html`);
    });
}

module.exports = app; // Export for testing
