const express = require('express');
const router = express.Router();
const { searchProducts, getProduct } = require('../controllers/search.controller');
const { protect } = require('../middleware/auth');

router.post('/products', protect, searchProducts);
router.get('/products/:id', protect, getProduct);

module.exports = router;