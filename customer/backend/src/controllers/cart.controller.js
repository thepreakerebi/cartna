const Cart = require('../models/cart.model');
const Product = require('../../../../supermarket/backend/src/models/product.model');
const Branch = require('../../../../supermarket/backend/src/models/branch.model');
const Supermarket = require('../../../../supermarket/backend/src/models/supermarket.model');

// Get cart for the authenticated customer
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ customer: req.customer.id })
      .populate('items.product', 'name price images')
      .populate('items.branch', 'name location');

    if (!cart) {
      cart = await Cart.create({
        customer: req.customer.id,
        items: []
      });
    }

    res.status(200).json({
      status: 'success',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide product ID and valid quantity'
      });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Get branch ID from product
    const branchId = product.createdBy;

    let cart = await Cart.findOne({ customer: req.customer.id });

    // Create new cart if doesn't exist
    if (!cart) {
      cart = await Cart.create({
        customer: req.customer.id,
        items: []
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.branch.toString() === branchId.toString()
    );

    if (existingItemIndex > -1) {
      // Update quantity and recalculate price if item exists
      cart.items[existingItemIndex].quantity = quantity;
      cart.items[existingItemIndex].price = product.unitPrice * quantity;
    } else {
      // Add new item with calculated total price
      cart.items.push({
        product: productId,
        branch: branchId,
        quantity,
        price: product.unitPrice * quantity
      });
    }

    await cart.save();

    // Populate product, branch, and supermarket details
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name price images unitPrice')
      .populate({
        path: 'items.branch',
        select: 'name location createdBy',
        populate: {
          path: 'createdBy',
          select: 'supermarketName',
          model: 'Supermarket'
        }
      });

    res.status(200).json({
      status: 'success',
      data: cart,
      message: 'Item added to cart'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide product ID and valid quantity'
      });
    }

    // Get product details to get branch ID
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const branchId = product.createdBy;

    let cart = await Cart.findOne({ customer: req.customer.id });

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    // Find item index
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.branch.toString() === branchId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found in cart'
      });
    }

    // Update quantity and recalculate price
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.unitPrice * quantity;
    await cart.save();

    // Populate product and branch details with unitPrice
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name price images unitPrice')
      .populate({
        path: 'items.branch',
        select: 'name location createdBy',
        populate: {
          path: 'createdBy',
          select: 'supermarketName',
          model: 'Supermarket'
        }
      });

    res.status(200).json({
      status: 'success',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide product ID'
      });
    }

    // Get product details to get branch ID
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const branchId = product.createdBy;

    let cart = await Cart.findOne({ customer: req.customer.id });

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    // Remove item
    cart.items = cart.items.filter(
      item => !(item.product.toString() === productId && item.branch.toString() === branchId.toString())
    );

    await cart.save();

    // Populate product and branch details with unitPrice
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name price images unitPrice')
      .populate({
        path: 'items.branch',
        select: 'name location createdBy',
        populate: {
          path: 'createdBy',
          select: 'supermarketName',
          model: 'Supermarket'
        }
      });

    res.status(200).json({
      status: 'success',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ customer: req.customer.id });

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      status: 'success',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};