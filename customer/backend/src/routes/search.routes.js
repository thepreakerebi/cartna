const express = require('express');
const router = express.Router();
const { searchProducts } = require('../controllers/search.controller');
const { protect } = require('../middleware/auth');

router.post('/products', protect, searchProducts);

module.exports = router;