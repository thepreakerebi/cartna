const SKUFormat = require('../models/sku.format.model');

// Default SKU format configuration
const DEFAULT_FORMAT = ['CATEGORY', 'BRAND', 'WEIGHT', 'ID'];
const DEFAULT_SEPARATOR = '-';
const VALID_COMPONENTS = ['CATEGORY', 'BRAND', 'SUPPLIER NAME', 'SUPPLIER CODE', 'WEIGHT', 'ID'];

// Reset SKU format to default configuration
exports.resetSKUFormat = async (req, res) => {
  try {
    // Find the active format
    let skuFormat = await SKUFormat.findOne({ active: true });
    
    if (!skuFormat) {
      // Create new format with default configuration
      skuFormat = new SKUFormat({
        format: DEFAULT_FORMAT,
        separator: DEFAULT_SEPARATOR,
        active: true,
        createdBy: req.admin.id
      });
    } else {
      // Reset existing format to default configuration
      skuFormat.format = DEFAULT_FORMAT;
      skuFormat.separator = DEFAULT_SEPARATOR;
    }

    await skuFormat.save();

    res.status(200).json({
      success: true,
      data: skuFormat,
      message: 'SKU format reset to default configuration'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get active SKU format or ensure default format exists
exports.getActiveSKUFormat = async (req, res) => {
  try {
    let skuFormat = await SKUFormat.findOne({ active: true });

    // If no active format exists, create the default format
    if (!skuFormat) {
      // For branch managers, use their branch's admin as the creator
      const creatorId = req.user.role === 'branch_manager' ? req.admin.id : req.admin.id;
      
      skuFormat = new SKUFormat({
        format: DEFAULT_FORMAT,
        separator: DEFAULT_SEPARATOR,
        active: true,
        createdBy: creatorId
      });
      await skuFormat.save();
    }

    res.status(200).json({
      success: true,
      data: skuFormat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update SKU format
exports.updateSKUFormat = async (req, res) => {
  try {
    const { format, separator } = req.body;

    // Validate format array
    if (!Array.isArray(format) || format.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Format must have at least one attribute'
      });
    }

    // Convert all format components to uppercase
    const uppercaseFormat = format.map(component => component.toUpperCase());

    // Validate format components
    const invalidComponents = uppercaseFormat.filter(component => !VALID_COMPONENTS.includes(component));
    if (invalidComponents.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid format components: ${invalidComponents.join(', ')}. Valid components are: ${VALID_COMPONENTS.join(', ')}`
      });
    }

    // Validate separator
    if (separator && typeof separator !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Separator must be a string'
      });
    }

    // Find the active format or create a new one if none exists
    let skuFormat = await SKUFormat.findOne({ active: true });
    
    if (!skuFormat) {
      skuFormat = new SKUFormat({
        format: uppercaseFormat,
        separator: separator || DEFAULT_SEPARATOR,
        active: true,
        createdBy: req.admin.id
      });
    } else {
      // Update existing format
      skuFormat.format = uppercaseFormat;
      if (separator) skuFormat.separator = separator;
    }

    await skuFormat.save();

    res.status(200).json({
      success: true,
      data: skuFormat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};