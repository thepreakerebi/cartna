const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^\+[1-9]\d{1,14}$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number! Must start with + and contain 1-15 digits`
      }
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty email
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8
    },
    isActive: {
      type: Boolean,
      default: true
    },
  
    logo: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty logo
          return /^https?:\/\/.+/.test(v);
        },
        message: props => `${props.value} is not a valid URL!`
      }
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one active admin exists
adminSchema.pre('save', async function(next) {
  try {
    if (!this.isActive) return next();

    const Admin = this.model('Admin');
    const query = { 
      isActive: true,
      _id: { $ne: this._id }
    };

    const existingAdmin = await Admin.findOne(query);
    if (existingAdmin) {
      throw new Error(
        this.isNew 
          ? 'An active admin already exists' 
          : 'Another active admin already exists'
      );
    }
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Error checking active admin'));
  }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Error hashing password'));
  }
});

// Prevent password field from being returned in queries
adminSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.password;
    return ret;
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};



// Validation schema
const validateAdmin = (admin) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    email: Joi.string().email().optional().allow(''),
    password: Joi.string().min(8).optional(),
    isActive: Joi.boolean().optional()
  }).unknown(true);

  return schema.validate(admin);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
module.exports.validateAdmin = validateAdmin;