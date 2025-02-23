const express = require('express');
const { supermarketSignup, supermarketLogin, updateSupermarket } = require('../controllers/supermarket.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Admin authentication routes
router.post('/create-account', supermarketSignup);
router.post('/login', supermarketLogin);

// Supermarket profile routes
router.patch('/update-profile', authMiddleware, upload.single('logo'), updateSupermarket);

module.exports = router;