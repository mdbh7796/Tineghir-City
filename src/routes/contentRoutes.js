const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const authenticate = require('../middleware/authMiddleware');

router.get('/', contentController.getAllContent);
router.post('/', authenticate, contentController.updateContent);

module.exports = router;
