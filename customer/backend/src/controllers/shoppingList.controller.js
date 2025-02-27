const nlp = require('compromise');
const Product = require('../../../../supermarket/backend/src/models/product.model');
const Cart = require('../models/cart.model');

exports.processShoppingList = async (req, res) => {
    try {
        const { list } = req.body;
        
        // Parse the shopping list using NLP
        const doc = nlp(list);
        const items = doc.nouns().out('array')
            .map(item => item.toLowerCase().trim())
            .filter(item => item.length > 0);

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid items found in the shopping list'
            });
        }

        // Find the cheapest product for each item
        const cheapestProducts = [];
        for (const item of items) {
            const pipeline = [
                {
                    $search: {
                        index: "product",
                        text: {
                            query: item,
                            path: ["productName", "description"],
                            fuzzy: {
                                maxEdits: 1,
                                prefixLength: 2
                            }
                        }
                    }
                },
                {
                    $match: {
                        active: true
                    }
                },
                {
                    $sort: { unitPrice: 1 }
                },
                {
                    $limit: 1
                }
            ];

            const [cheapestProduct] = await Product.aggregate(pipeline);
            if (cheapestProduct) {
                cheapestProducts.push({
                    searchTerm: item,
                    product: cheapestProduct
                });
            }
        }

        // Add products to cart
        let cart = await Cart.findOne({ customer: req.customer.id });
        if (!cart) {
            cart = await Cart.create({
                customer: req.customer.id,
                items: []
            });
        }

        // Add each product to cart
        for (const { product } of cheapestProducts) {
            const existingItemIndex = cart.items.findIndex(
                item => item.product.toString() === product._id.toString() &&
                       item.branch.toString() === product.createdBy.toString()
            );

            if (existingItemIndex === -1) {
                cart.items.push({
                    product: product._id,
                    branch: product.createdBy,
                    quantity: 1,
                    price: product.unitPrice
                });
            }
        }

        await cart.save();

        // Populate cart details
        cart = await Cart.findById(cart._id)
            .populate('items.product', 'productName unitPrice images')
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
            success: true,
            message: 'Shopping list processed successfully',
            data: {
                processedItems: items,
                cheapestProducts,
                cart
            }
        });

    } catch (error) {
        console.error('Shopping list processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing shopping list',
            error: error.message
        });
    }
};

exports.updateShoppingList = async (req, res) => {
    try {
        const { list } = req.body;
        
        // Parse the new shopping list
        const doc = nlp(list);
        const items = doc.nouns().out('array')
            .map(item => item.toLowerCase().trim())
            .filter(item => item.length > 0);

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid items found in the shopping list'
            });
        }

        // Clear existing cart
        let cart = await Cart.findOne({ customer: req.customer.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        // Find and add new cheapest products
        const cheapestProducts = [];
        for (const item of items) {
            const pipeline = [
                {
                    $search: {
                        index: "product",
                        text: {
                            query: item,
                            path: ["productName", "description"],
                            fuzzy: {
                                maxEdits: 1,
                                prefixLength: 2
                            }
                        }
                    }
                },
                {
                    $match: {
                        active: true
                    }
                },
                {
                    $sort: { unitPrice: 1 }
                },
                {
                    $limit: 1
                }
            ];

            const [cheapestProduct] = await Product.aggregate(pipeline);
            if (cheapestProduct) {
                cheapestProducts.push({
                    searchTerm: item,
                    product: cheapestProduct
                });
            }
        }

        // Add new products to cart
        if (!cart) {
            cart = await Cart.create({
                customer: req.customer.id,
                items: []
            });
        }

        for (const { product } of cheapestProducts) {
            cart.items.push({
                product: product._id,
                branch: product.createdBy,
                quantity: 1,
                price: product.unitPrice
            });
        }

        await cart.save();

        // Populate cart details
        cart = await Cart.findById(cart._id)
            .populate('items.product', 'productName unitPrice images')
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
            success: true,
            message: 'Shopping list updated successfully',
            data: {
                processedItems: items,
                cheapestProducts,
                cart
            }
        });

    } catch (error) {
        console.error('Shopping list update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating shopping list',
            error: error.message
        });
    }
};

exports.clearShoppingList = async (req, res) => {
    try {
        // Find and clear the cart
        const cart = await Cart.findOne({ customer: req.customer.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.status(200).json({
            success: true,
            message: 'Shopping list cleared successfully',
            data: { cart }
        });

    } catch (error) {
        console.error('Shopping list clear error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing shopping list',
            error: error.message
        });
    }
};