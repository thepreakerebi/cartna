const Product = require('../models/product.model');
const { validateProduct } = require('../models/product.model');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to generate SKU
const generateSKU = async (productData, branchId) => {
  try {
    // Get the active SKU format directly from the database
    const skuFormat = await mongoose.model('SKUFormat').findOne({ active: true });

    if (!skuFormat) {
      // If no format exists, use default format
      const DEFAULT_FORMAT = ['CATEGORY', 'BRAND', 'WEIGHT', 'ID'];
      const DEFAULT_SEPARATOR = '-';
      
      // Create new format with default configuration
      const newSkuFormat = new (mongoose.model('SKUFormat'))({
        format: DEFAULT_FORMAT,
        separator: DEFAULT_SEPARATOR,
        active: true,
        createdBy: branchId
      });
      await newSkuFormat.save();
      skuFormat = newSkuFormat;
    }

    // Generate 4-digit ID if not provided
    if (!productData.skuId) {
      productData.skuId = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Get required data
    const category = await mongoose.model('Category').findById(productData.category);

    // Build SKU components
    const skuComponents = skuFormat.format.map((component) => {
      switch (component) {
        case 'CATEGORY':
          return category ? category.categoryName.substring(0, 3).toUpperCase() : 'XXX';
        case 'BRAND':
          return productData.brand ? productData.brand.substring(0, 3).toUpperCase() : 'XXX';
        case 'SUPPLIER NAME':
          return productData.supplierName ? productData.supplierName.substring(0, 3).toUpperCase() : 'XXX';
        case 'SUPPLIER CODE':
          return productData.supplierCode ? productData.supplierCode.substring(0, 3).toUpperCase() : 'XXX';
        case 'WEIGHT':
          return productData.weight ? productData.weight.toString().replace(/[^0-9]/g, '').substring(0, 3) : 'XXX';
        case 'ID':
          return productData.skuId;
        default:
          return 'XXX';
      }
    });

    // Join components with separator
    return skuComponents.join(skuFormat.separator || '-');
  } catch (error) {
    throw new Error('Error generating SKU: ' + error.message);
  }
};

// Helper function to validate image size
const validateImageSize = (image) => {
  // Check if the image is a base64 string
  if (image.startsWith('data:')) {
    const base64Data = image.split(',')[1];
    const sizeInBytes = Buffer.from(base64Data, 'base64').length;
    return sizeInBytes <= 16 * 1024 * 1024; // 16MB in bytes
  }
  return true; // Skip validation for URLs
};

// Helper function to upload images to Cloudinary
const uploadToCloudinary = async (images) => {
  try {
    // Validate image sizes first
    for (const image of images) {
      if (!validateImageSize(image)) {
        throw new Error('Image size must not exceed 16MB');
      }
    }

    const uploadPromises = images.map(image => {
      return cloudinary.uploader.upload(image, {
        folder: 'lemoncart/products',
        resource_type: 'auto'
      });
    });

    const results = await Promise.all(uploadPromises);
    return results.map(result => result.secure_url);
  } catch (error) {
    throw new Error('Error uploading images to Cloudinary: ' + error.message);
  }
};

// Create a new product (Branch Manager only)
exports.createProduct = async (req, res) => {
  try {
    // Ensure the user is a branch manager
    if (req.user.role !== 'branch_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only branch managers can create products'
      });
    }

    // Get product data from form fields
    const productData = req.body;

    // Check if product with same name already exists in the same branch
    if (productData.productName) {
      const existingProduct = await Product.findOne({
        productName: productData.productName,
        createdBy: req.user.branchId
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'A product with this name already exists in your branch'
        });
      }
    }

    // Get the branch's supermarket ID
    const branch = await mongoose.model('Branch').findById(req.user.branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Validate that the category exists and belongs to the branch manager's supermarket
    if (productData.category) {
      const category = await mongoose.model('Category').findOne({
        _id: productData.category,
        supermarketId: branch.createdBy
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. The category must belong to your supermarket'
        });
      }
    }
    
    // Get uploaded files
    const files = req.files;
    
    // Validate and process images first
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 images allowed per product'
      });
    }

    // Convert files to base64 strings for Cloudinary upload
    const base64Images = files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);

    // Upload images to Cloudinary
    const imageUrls = await uploadToCloudinary(base64Images);

    // Add image URLs to product data
    productData.images = imageUrls;

    // Ensure productName is provided
    if (!productData.productName) {
      return res.status(400).json({
        success: false,
        message: '"productName" is required'
      });
    }

    // Format weight if provided
    if (productData.weight) {
      const numericWeight = parseFloat(productData.weight);
      if (isNaN(numericWeight)) {
        return res.status(400).json({
          success: false,
          message: 'Weight must be a valid number'
        });
      }
      productData.weight = `${numericWeight}`;
    }

    // Validate product data
    const { error } = validateProduct(productData);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Handle discount calculation
    if (req.body.discount !== undefined) {
      if (req.body.discount < 0 || req.body.discount > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount must be a percentage between 0 and 100'
        });
      }
      const discountAmount = (req.body.discount / 100) * req.body.unitPrice;
      productData.discountPrice = req.body.unitPrice - discountAmount;
      productData.discount = req.body.discount;
    }

    // Generate SKU for the new product
    const sku = await generateSKU(productData, req.user.branchId);

    const product = new Product({
      ...productData,
      images: imageUrls,
      createdBy: req.user.branchId,
      supermarketId: branch.createdBy,
      sku
    });

    try {
      await product.save();
    } catch (error) {
      // Handle duplicate SKU error
      if (error.code === 11000 && error.keyPattern.sku) {
        return res.status(400).json({
          success: false,
          message: 'A product with this SKU already exists'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data: product,
      message: 'New product created'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all products (Supermarket Admin gets their supermarket's products, Branch Manager gets only their products)
exports.getAllProducts = async (req, res) => {
  try {
    let query = { active: true };
    
    // If branch manager, only show their products
    if (req.user.role === 'branch_manager') {
      query.createdBy = req.user.branchId;
    } else if (req.admin && req.admin.id) {
      // For supermarket admin, only show products from their supermarket
      query.supermarketId = req.admin.id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view products'
      });
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('createdBy', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Authorization check based on user role
    if (req.user.role === 'branch_manager') {
      // For branch manager, check if they created the product
      if (product.createdBy._id.toString() !== req.user.branchId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this product'
        });
      }
    } else if (req.admin && req.admin.id) {
      // For supermarket admin, check if product belongs to their supermarket
      if (product.supermarketId.toString() !== req.admin.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this product'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view products'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update a product (Admin and Branch Manager)
exports.updateProduct = async (req, res) => {
  try {
    // Find the product and ensure it exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Initialize update data with existing product data
    const productData = { ...req.body };

    // Authorization check - only supermarket admin or original branch manager can update
    if (req.user.role === 'branch_manager') {
      // For branch manager, check if they created the product
      if (product.createdBy.toString() !== req.user.branchId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this product'
        });
      }

      // If category is being updated, validate it belongs to the branch manager's supermarket
      if (productData.category) {
        const branch = await mongoose.model('Branch').findById(req.user.branchId);
        if (!branch) {
          return res.status(404).json({
            success: false,
            message: 'Branch not found'
          });
        }

        const category = await mongoose.model('Category').findOne({
          _id: productData.category,
          supermarketId: branch.createdBy
        });
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category. The category must belong to your supermarket'
          });
        }
      }
    } else if (req.admin && req.admin.id) {
      // For supermarket admin, check if product belongs to their supermarket
      if (product.supermarketId.toString() !== req.admin.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this product'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update products'
      });
    }

    // Check if another product with the same name exists in the same branch (excluding current product)
    if (productData.productName) {
      const existingProduct = await Product.findOne({
        productName: productData.productName,
        createdBy: req.user.branchId,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'A product with this name already exists in your branch'
        });
      }
    }
    
    // Handle image updates if files are provided
    const files = req.files;
    if (files && Array.isArray(files) && files.length > 0) {
      if (files.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 5 images allowed per product'
        });
      }

      // Delete old images from Cloudinary
      if (product.images && product.images.length > 0) {
        try {
          const deletePromises = product.images.map(imageUrl => {
            // Extract public ID including the folder path
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const publicId = `lemoncart/products/${fileName.split('.')[0]}`;
            return cloudinary.uploader.destroy(publicId);
          });
          await Promise.all(deletePromises);
        } catch (deleteError) {
          console.error('Error deleting old images:', deleteError);
          // Continue with upload even if deletion fails
        }
      }

      // Process and upload new images
      try {
        // Convert files to base64 strings for Cloudinary upload
        const base64Images = files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
        
        // Upload images to Cloudinary using the helper function
        const imageUrls = await uploadToCloudinary(base64Images);
        if (!imageUrls || imageUrls.length === 0) {
          throw new Error('Failed to upload images to Cloudinary');
        }
        // Replace the old images array with the new one
        productData.images = imageUrls;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Error uploading images: ' + error.message
        });
      }
    }

    // Format weight if provided
    if (productData.weight !== undefined) {
      const numericWeight = parseFloat(productData.weight);
      if (isNaN(numericWeight)) {
        return res.status(400).json({
          success: false,
          message: 'Weight must be a valid number'
        });
      }
      productData.weight = `${numericWeight}`;
    }

    // Validate the update data
    const { error } = validateProduct(productData, true);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Handle discount calculations
    if (productData.discount !== undefined || productData.unitPrice !== undefined) {
      const newDiscount = productData.discount !== undefined ? productData.discount : product.discount;
      const newUnitPrice = productData.unitPrice !== undefined ? productData.unitPrice : product.unitPrice;

      if (newDiscount !== undefined) {
        if (newDiscount < 0 || newDiscount > 100) {
          return res.status(400).json({
            success: false,
            message: 'Discount must be a percentage between 0 and 100'
          });
        }
        const discountAmount = (newDiscount / 100) * newUnitPrice;
        productData.discountPrice = newUnitPrice - discountAmount;
        productData.discount = newDiscount;
      }
    }

    // Generate new SKU if relevant fields are updated
    const skuFields = ['category', 'brand', 'supplierName', 'supplierCode', 'weight', 'skuId'];
    const needsSKUUpdate = skuFields.some(field => productData[field] !== undefined);
    
    if (needsSKUUpdate) {
      try {
        productData.sku = await generateSKU(
          { ...product.toObject(), ...productData },
          req.user.branchId
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Error generating SKU: ' + error.message
        });
      }
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productData },
      { new: true, runValidators: true }
    )
      .populate('category', 'name')
      .populate('createdBy', 'name');

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a product (Admin and Branch Manager)
exports.deleteProduct = async (req, res) => {
  try {
    // Find the product and ensure it exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Authorization check - only admin or original branch manager can delete
    if (req.user.role === 'branch_manager' && 
        product.createdBy.toString() !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    // Delete product images from Cloudinary
    if (product.images && product.images.length > 0) {
      try {
        const deletePromises = product.images.map(imageUrl => {
          const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0];
          return cloudinary.uploader.destroy(`lemoncart/products/${publicId}`);
        });
        await Promise.all(deletePromises);
      } catch (deleteError) {
        console.error('Error deleting product images:', deleteError);
        // Continue with deletion even if image cleanup fails
      }
    }

    // Delete the product from database
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: '1 product deleted'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product: ' + error.message
    });
  }
};