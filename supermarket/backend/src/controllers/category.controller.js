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
    const capitalizedName = req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1);
    req.body.name = capitalizedName;

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
      name: capitalizedName,
      $or: [
        { createdBy: { $in: await Branch.find({ createdBy: branch.createdBy }).distinct('_id') } }
      ]
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    const category = new Category({
      ...req.body,
      createdBy: req.user.branchId
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
    
    // If branch manager, only show their categories
    if (req.user.role === 'branch_manager') {
      query.createdBy = req.user.branchId;
    }

    const categories = await Category.find(query)
      .populate('createdBy', 'name')
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
      .populate('createdBy', 'name');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
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
    if (req.body.name && req.body.name !== category.name) {
      // Capitalize the new name before checking for duplicates
      const capitalizedName = req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1);
      req.body.name = capitalizedName;
      
      const existingCategory = await Category.findOne({ name: capitalizedName });
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