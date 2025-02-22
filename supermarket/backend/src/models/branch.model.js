const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const branchSchema = new mongoose.Schema({
  manager: {
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
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    verificationRequestId: {
      type: String,
      default: null
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    password: {
      type: String,
      required: true,
      minlength: [6, 'Password must be at least 6 characters long']
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    placeId: {
      type: String,
      required: true
    },
    formattedAddress: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  createdBy: {
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

// Create a geospatial index on the location.coordinates field
branchSchema.index({ 'location.coordinates': '2dsphere' });

// Create a compound index for name and createdBy to ensure uniqueness within a supermarket
branchSchema.index({ name: 1, createdBy: 1 }, { unique: true });

// Hash manager's password before saving
branchSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('manager.password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.manager.password = await bcrypt.hash(this.manager.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;