const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBranch,
  getAllBranches,
  getBranch,
  updateBranch,
  deleteBranch,
  login
} = require('../controllers/branch.controller');

// Branch manager login route (unprotected)
router.post('/login', login);

// Protect all routes below this middleware
router.use(protect);

router
  .route('/')
  .post(createBranch)
  .get(getAllBranches);

router
  .route('/:id')
  .get(getBranch)
  .patch(updateBranch)
  .delete(deleteBranch);

module.exports = router;