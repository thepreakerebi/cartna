const express = require('express');
const { adminSignup, adminLogin, updateAdmin } = require('../controllers/admin.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Admin authentication routes
router.post('/create-account', adminSignup);
router.post('/login', adminLogin);

// Admin profile routes
router.patch('/update-profile', authMiddleware, upload.single('logo'), updateAdmin);

module.exports = router;