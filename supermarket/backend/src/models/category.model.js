const mongoose = require('mongoose');
const Joi = require('joi');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50,
    set: function(value) {
      if (!value) return value;
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  supermarketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Updated compound index to use supermarketId instead of createdBy
categorySchema.index({ name: 1, supermarketId: 1 }, { unique: true });

// Validation schema
const validateCategory = (category, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate ? Joi.string().min(2).max(50).optional() : Joi.string().min(2).max(50).required(),
    description: Joi.string().max(500).optional(),
    active: Joi.boolean().optional()
  });

  return schema.validate(category);
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
module.exports.validateCategory = validateCategory;