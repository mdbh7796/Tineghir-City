const express = require('express');
const router = express.Router();
const attractionController = require('../controllers/attractionController');
const authenticate = require('../middleware/authMiddleware');

router.get('/', attractionController.getAllAttractions);
router.post('/', authenticate, attractionController.addAttraction);
router.delete('/:id', authenticate, attractionController.deleteAttraction);

module.exports = router;
