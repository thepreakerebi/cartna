const Category = require('../models/category.model');
const { validateCategory } = require('../models/category.model');
const Branch = require('../models/branch.model');

// Create a new category (Branch Manager only)
exports.createCategory = async (req, res) => {
  try {
    // Ensure the user is a branch manager
    if (req.user.role !== 'branch_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only branch managers can create categories'
      });
    }

    const { error } = validateCategory(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Capitalize the category name before checking for duplicates
    const capitalizedName = req.body.categoryName.charAt(0).toUpperCase() + req.body.categoryName.slice(1);
    req.body.categoryName = capitalizedName;

    // Get the branch's supermarket ID
    const branch = await Branch.findById(req.user.branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if category with same name already exists in the same supermarket
    const existingCategory = await Category.findOne({
      categoryName: capitalizedName,
      supermarketId: branch.createdBy
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    const category = new Category({
      ...req.body,
      createdBy: req.user.branchId,
      supermarketId: branch.createdBy
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category,
      message: 'New category created'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    let query = { active: true };
    
    if (req.user.role === 'branch_manager') {
      // For branch manager, get their branch to determine supermarket ID
      const branch = await Branch.findById(req.user.branchId);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }
      query.supermarketId = branch.createdBy;
    } else if (req.admin && req.admin.id) {
      // For supermarket admin, filter by their ID as supermarketId
      query.supermarketId = req.admin.id;
    } else {
      // For other users, return unauthorized
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view categories'
      });
    }

    // Filter categories based on query
    const categories = await Category.find(query)
      .populate('createdBy', 'branchName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single category
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'branchName');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get the branch to determine supermarket ID
    const branch = await Branch.findById(req.user.branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if user has access to this category
    if (category.supermarketId.toString() !== branch.createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this category'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update a category (Admin and Branch Manager)
exports.updateCategory = async (req, res) => {
  try {
    // Ensure the user is either an admin or the branch manager who created the category
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If name is being updated, check for duplicates
    if (req.body.categoryName && req.body.categoryName !== category.categoryName) {
      // Capitalize the new name before checking for duplicates
      const capitalizedName = req.body.categoryName.charAt(0).toUpperCase() + req.body.categoryName.slice(1);
      req.body.categoryName = capitalizedName;
      
      const existingCategory = await Category.findOne({
        categoryName: capitalizedName,
        supermarketId: category.supermarketId
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'A category with this name already exists'
        });
      }
    }

    if (req.user.role !== 'admin' && 
        (req.user.role === 'branch_manager' && 
        category.createdBy.toString() !== req.user.branchId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category'
      });
    }

    const { error } = validateCategory(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a category (Admin and Branch Manager)
exports.deleteCategory = async (req, res) => {
  try {
    // Ensure the user is either an admin or the branch manager who created the category
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (req.user.role !== 'admin' && 
        (req.user.role === 'branch_manager' && 
        category.createdBy.toString() !== req.user.branchId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this category'
      });
    }

    // Perform complete deletion from database
    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '1 category deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};