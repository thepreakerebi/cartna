const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const supermarketSchema = new mongoose.Schema({
  supermarketName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  admin: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return v && /^\+250[0-9]{9}$/.test(v);
        },
        message: props => `${props.value} is not a valid mobile number. Please enter a number with +250 prefix followed by 9 digits`
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    }
  },
  logo: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create a compound index for admin.mobileNumber to ensure uniqueness
supermarketSchema.index({ 'admin.mobileNumber': 1 }, { unique: true });

// Hash password before saving
supermarketSchema.pre('save', async function(next) {
  if (!this.isModified('admin.password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.admin.password = await bcrypt.hash(this.admin.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
supermarketSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.admin.password);
};

// Validation schema
const validateSupermarket = (data) => {
  const schema = Joi.object({
    supermarketName: Joi.string().required(),
    admin: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email(),
      mobileNumber: Joi.string().pattern(/^[0-9]{9}$/).required().messages({
        'string.pattern.base': 'Mobile number must be 9 digits'
      }),
      password: Joi.string().min(6).required()
    }).required(),
    logo: Joi.string(),
    isActive: Joi.boolean()
  });

  return schema.validate(data);
};

const Supermarket = mongoose.model('Supermarket', supermarketSchema);

module.exports = Supermarket;
module.exports.validateSupermarket = validateSupermarket;