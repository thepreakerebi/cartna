const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/customer.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/create-account', register);
router.post('/login', login);

// Protected routes
router.use(protect);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

module.exports = router;