const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticate = require('../middleware/authMiddleware');

// Public: Send a message
router.post('/', messageController.sendMessage);

// Protected: View messages (for admin panel)
router.get('/', authenticate, messageController.getMessages);

module.exports = router;
