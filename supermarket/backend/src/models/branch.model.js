const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Helper function to capitalize words
const capitalizeWords = (str) => {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const branchSchema = new mongoose.Schema({
  manager: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      set: capitalizeWords
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      set: capitalizeWords
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      validate: {
        validator: function(v) {
          // Remove the +250 prefix if it exists before validation
          const numberToValidate = v.startsWith('+250') ? v.slice(4) : v;
          const cleaned = numberToValidate.replace(/\D/g, '');
          return cleaned && cleaned.length === 9;
        },
        message: props => `${props.value} is not a valid mobile number. Please enter 9 digits`
      },
      set: function(v) {
        if (!v) return v;
        // Remove any non-digit characters and existing prefix
        const cleaned = v.replace(/\D/g, '').slice(-9);
        // Only add prefix if we have exactly 9 digits
        return cleaned.length === 9 ? `+250${cleaned}` : v;
      }
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
  branchName: {
    type: String,
    required: true,
    trim: true,
    set: capitalizeWords
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
    ref: 'Supermarket',
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
branchSchema.index({ branchName: 1, createdBy: 1 }, { unique: true });

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