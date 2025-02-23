const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    validate: {
      validator: function(v) {
        // Validate Rwandan phone number format (9 digits)
        return /^\d{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid mobile number! Please enter 9 digits.`
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
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  address: {
    placeId: String,
    formattedAddress: String,
    location: {
      type: { type: String },
      coordinates: { type: [Number], default: undefined }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
customerSchema.index({ 'address.location': '2dsphere' });

// Add +250 prefix to mobile number before saving
customerSchema.pre('save', function(next) {
  if (this.isModified('mobileNumber')) {
    this.mobileNumber = '+250' + this.mobileNumber;
  }
  next();
});

// Hash password before saving
customerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Method to check if password is correct
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;