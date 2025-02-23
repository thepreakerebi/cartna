const Customer = require('../models/customer.model');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Register a new customer
exports.register = async (req, res) => {
  try {
    const { firstName: rawFirstName, lastName: rawLastName, mobileNumber, email, password, address } = req.body;
    // Capitalize first and last names
    const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();
    const lastName = rawLastName.charAt(0).toUpperCase() + rawLastName.slice(1).toLowerCase();

    // Create new customer
    const customer = await Customer.create({
      firstName,
      lastName,
      mobileNumber,
      email,
      password,
      address
    });

    // Generate token
    const token = generateToken(customer._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        customer: {
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          mobileNumber: customer.mobileNumber,
          email: customer.email,
          address: customer.address
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile number already exists'
      });
    }
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Login customer
exports.login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // Check if mobile number and password exist
    if (!mobileNumber || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide mobile number and password'
      });
    }

    // Find customer by mobile number
    const customer = await Customer.findOne({ mobileNumber: '+250' + mobileNumber });

    // Check if customer exists and password is correct
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect mobile number or password'
      });
    }

    // Generate token
    const token = generateToken(customer._id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        customer: {
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          mobileNumber: customer.mobileNumber,
          email: customer.email,
          address: customer.address
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get current customer profile
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);

    res.status(200).json({
      status: 'success',
      data: {
        customer: {
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          mobileNumber: customer.mobileNumber,
          email: customer.email,
          address: customer.address
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update customer profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName: rawFirstName, lastName: rawLastName, email, address } = req.body;
    // Capitalize first and last names
    const firstName = rawFirstName ? rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase() : undefined;
    const lastName = rawLastName ? rawLastName.charAt(0).toUpperCase() + rawLastName.slice(1).toLowerCase() : undefined;

    const customer = await Customer.findByIdAndUpdate(
      req.customer.id,
      { firstName, lastName, email, address },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        customer: {
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: customer.phoneNumber,
          email: customer.email,
          address: customer.address
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};