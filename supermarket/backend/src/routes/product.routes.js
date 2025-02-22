const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB max file size
    files: 5 // Maximum 5 files
  }
});


// Protect all routes
router.use(authMiddleware);

router
  .route('/')
  .post(upload.array('images', 5), createProduct)
  .get(getAllProducts);

router
  .route('/:id')
  .get(getProduct)
  .patch(upload.array('images', 5), updateProduct)
  .delete(deleteProduct);

module.exports = router;