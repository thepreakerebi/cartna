const mongoose = require('mongoose');
const Joi = require('joi');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
    set: function(value) {
      if (!value) return value;
      return value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  images: {
    type: [String],
    required: [true, 'At least one product image is required'],
    validate: {
      validator: function(value) {
        return value.length > 0 && value.length <= 5;
      },
      message: 'Product must have between 1 and 5 images'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Product quantity is required'],
    min: 0
  },
  unitPrice: {
    type: Number,
    required: [true, 'Product unit price is required'],
    min: 0
  },
  unitOfMeasurement: {
    type: String,
    enum: ['piece', 'kg', 'g', 'l', 'ml', 'pack'],
    default: 'piece'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  supermarketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supermarket',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  sku: {
    type: String,
    unique: true,
    required: true
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 100,
    set: function(value) {
      if (!value) return value;
      return value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
  },
  supplierName: {
    type: String,
    trim: true,
    maxlength: 100,
    set: function(value) {
      if (!value) return value;
      return value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
  },
  supplierCode: {
    type: String,
    trim: true,
    maxlength: 50
  },
  weight: {
    type: String,
    trim: true,
    maxlength: 50,
    set: function(value) {
      if (!value) return value;
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) return value;
      return `${numericValue}${this.unitOfMeasurement}`;
    }
  },
  skuId: {
    type: String,
    length: 4,
    validate: {
      validator: function(value) {
        return !value || /^\d{4}$/.test(value);
      },
      message: 'SKU ID must be a 4-digit number'
    }
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    validate: {
      validator: function(value) {
        return !value || (value >= 0 && value <= 100);
      },
      message: 'Discount must be a percentage between 0 and 100'
    }
  },
  discountPrice: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});



// Validation schema
const validateProduct = (product, isUpdate = false) => {
  const schema = Joi.object({
    productName: isUpdate ? Joi.string().min(2).max(100).optional() : Joi.string().min(2).max(100).required(),
    description: Joi.string().max(1000).optional(),
    images: isUpdate ? Joi.array().items(Joi.string()).min(1).max(5).optional() : Joi.array().items(Joi.string()).min(1).max(5).required(),
    quantity: isUpdate ? Joi.number().min(0).optional() : Joi.number().min(0).required(),
    unitPrice: isUpdate ? Joi.number().min(0).optional() : Joi.number().min(0).required(),
    unitOfMeasurement: Joi.string().valid('piece', 'kg', 'g', 'l', 'ml', 'pack').optional(),
    category: isUpdate ? Joi.string().optional() : Joi.string().required(),
    active: Joi.boolean().optional(),
    barcode: Joi.string().optional(),
    brand: isUpdate ? Joi.string().max(100).optional() : Joi.string().max(100).optional(),
    supplierName: isUpdate ? Joi.string().max(100).optional() : Joi.string().max(100).optional(),
    supplierCode: isUpdate ? Joi.string().max(50).optional() : Joi.string().max(50).optional(),
    weight: Joi.string().max(50).optional(),
    skuId: Joi.string().length(4).optional(),
    discount: Joi.number().min(0).max(100).optional(),
    discountPrice: Joi.number().min(0).optional()
  });

  return schema.validate(product);
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
module.exports.validateProduct = validateProduct;