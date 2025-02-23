const natural = require('natural');
const nlp = require('compromise');
const Product = require('../../../../supermarket/backend/src/models/product.model');


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

exports.searchProducts = async (req, res) => {
    try {
        const { query } = req.body;
        const { maxPrice } = extractPriceConstraints(query);
        
        // Process natural language query and remove stop words
        const doc = nlp(query);
        const stopWords = ['i', 'want', 'need', 'looking', 'for', 'the', 'a', 'an', 'and', 'or'];
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
                                    path: ["productName", "description"],
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
                $project: {
                    productName: 1,
                    unitPrice: 1,
                    description: 1,
                    'category.categoryName': 1,
                    'branch.name': 1,
                    'branch.location': 1,
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
                category: product.category.categoryName,
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