const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  getActiveSKUFormat,
  updateSKUFormat,
  resetSKUFormat
} = require('../controllers/sku.format.controller');

// Protect all routes
router.use(authMiddleware);

router
  .route('/')
  .get(getActiveSKUFormat)
  .patch(updateSKUFormat);

router
  .route('/reset')
  .post(resetSKUFormat);

module.exports = router;