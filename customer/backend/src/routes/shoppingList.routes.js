const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    processShoppingList, 
    updateShoppingList, 
    clearShoppingList 
} = require('../controllers/shoppingList.controller');

router.post('/process', protect, processShoppingList);
router.put('/update', protect, updateShoppingList);
router.delete('/clear', protect, clearShoppingList);

module.exports = router;