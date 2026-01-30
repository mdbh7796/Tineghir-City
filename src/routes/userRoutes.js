const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');

router.get('/', authenticate, userController.getAllUsers);
router.post('/', authenticate, userController.addUser);
router.delete('/:id', authenticate, userController.deleteUser);

module.exports = router;
