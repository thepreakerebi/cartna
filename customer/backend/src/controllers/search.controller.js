const nlp = require('compromise');
const Product = require('../../../../supermarket/backend/src/models/product.model');
const mongoose = require('mongoose');


// Helper function to extract price constraints
const extractPriceConstraints = (query) => {
    const doc = nlp(query);
    const numbers = doc.numbers().out('array');
    let maxPrice = Infinity;
    
    if (query.toLowerCase().includes('under') || query.toLowerCase().includes('less than')) {
        maxPrice = Math.min(...numbers.map(num => parseFloat(num)));
    }
    
    return { maxPrice };
};

// Helper function to clean and normalize voice input
const normalizeVoiceInput = (text) => {
    return text
        .replace(/period|full stop|comma|exclamation mark/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};

exports.getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                    active: true
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'branch'
                }
            },
            { $unwind: '$category' },
            { $unwind: '$branch' },
            {
                $lookup: {
                    from: 'supermarkets',
                    localField: 'supermarketId',
                    foreignField: '_id',
                    as: 'supermarket'
                }
            },
            { $unwind: '$supermarket' },
            {
                $project: {
                    productName: 1,
                    unitPrice: 1,
                    description: 1,
                    brand: 1,
                    'category.categoryName': 1,
                    'branch.name': 1,
                    'branch.location': 1,
                    'supermarket.supermarketName': 1,
                    images: 1,
                    stock: 1
                }
            }
        ];

        const [product] = await Product.aggregate(pipeline);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const formattedProduct = {
            id: product._id,
            name: product.productName,
            unitPrice: product.unitPrice,
            description: product.description,
            brand: product.brand,
            category: product.category.categoryName,
            supermarket: product.supermarket.supermarketName,
            branch: {
                name: product.branch.name,
                location: product.branch.location
            },
            images: product.images,
            stock: product.stock
        };

        res.json({
            success: true,
            data: formattedProduct
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving product details',
            error: error.message
        });
    }
};

exports.searchProducts = async (req, res) => {
    try {
        const { query, isVoiceInput } = req.body;
        
        // Handle voice input preprocessing
        const processedQuery = isVoiceInput ? normalizeVoiceInput(query) : query;
        const { maxPrice } = extractPriceConstraints(processedQuery);
        
        // Process natural language query and remove stop words
        const doc = nlp(processedQuery);
        const stopWords = ['i', 'want', 'need', 'looking', 'for', 'the', 'a', 'an', 'and', 'or', 
                         'show', 'me', 'find', 'search', 'get', 'please', 'would', 'like', 'can', 'you'];
        const searchTerms = doc.terms().out('array')
            .map(term => term.toLowerCase())
            .filter(term => !stopWords.includes(term));

        if (searchTerms.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid search term'
            });
        }
        
        // Create Atlas Search aggregation pipeline
        const pipeline = [
            {
                $search: {
                    index: "product",
                    compound: {
                        must: [
                            {
                                text: {
                                    query: searchTerms.join(" "),
                                    path: ["productName", "description", "brand"],
                                    fuzzy: {
                                        maxEdits: 1,
                                        prefixLength: 2
                                    }
                                }
                            }
                        ],
                        should: [
                            {
                                text: {
                                    query: searchTerms.join(" "),
                                    path: "productName",
                                    score: { boost: { value: 2 } }
                                }
                            },
                            {
                                text: {
                                    query: searchTerms.join(" "),
                                    path: "brand",
                                    score: { boost: { value: 1.5 } }
                                }
                            }
                        ]
                    }
                }
            },
            {
                $match: {
                    active: true,
                    unitPrice: { $lte: maxPrice || Infinity }
                }
            },
            {
                $addFields: {
                    score: { $meta: "searchScore" }
                }
            },
            {
                $match: {
                    score: { $gt: 0.5 }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'branch'
                }
            },
            { $unwind: '$category' },
            { $unwind: '$branch' },
            { $sort: { unitPrice: 1 } },
            {
                $lookup: {
                    from: 'supermarkets',
                    localField: 'supermarketId',
                    foreignField: '_id',
                    as: 'supermarket'
                }
            },
            { $unwind: '$supermarket' },
            {
                $group: {
                    _id: {
                        supermarketId: '$supermarketId',
                        productName: '$productName',
                        unitPrice: '$unitPrice'
                    },
                    doc: { $first: '$$ROOT' }
                }
            },
            {
                $replaceRoot: { newRoot: '$doc' }
            },
            {
                $project: {
                    productName: 1,
                    unitPrice: 1,
                    description: 1,
                    brand: 1,
                    'category.categoryName': 1,
                    'branch.name': 1,
                    'branch.location': 1,
                    'supermarket.supermarketName': 1,
                    images: 1,
                    stock: 1,
                    score: { $meta: "searchScore" }
                }
            }
        ];

        const products = await Product.aggregate(pipeline);

        // Sort by relevance score first, then by price
        const formattedResults = products
            .sort((a, b) => b.score - a.score || a.unitPrice - b.unitPrice)
            .map(product => ({
                id: product._id,
                name: product.productName,
                price: product.unitPrice,
                description: product.description,
                brand: product.brand,
                category: product.category.categoryName,
                supermarket: product.supermarket.supermarketName,
                branch: {
                    name: product.branch.name,
                    location: product.branch.location
                },
                images: product.images,
                stock: product.stock,
                relevanceScore: product.score
            }));

        res.json({
            success: true,
            count: formattedResults.length,
            searchTerms,
            priceRange: { maxPrice },
            inputType: isVoiceInput ? 'voice' : 'text',
            processedQuery,
            data: formattedResults
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing search request',
            error: error.message
        });
    }
};