const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cart.controller');

// Protect all cart routes
router.use(protect);

router
  .route('/')
  .get(getCart)
  .post(addToCart)
  .patch(updateCartItem)
  .delete(clearCart);

router.delete('/items', removeFromCart);

module.exports = router;