const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBranch,
  getAllBranches,
  getBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branch.controller');
const { login } = require('../controllers/branch.manager.controller');

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