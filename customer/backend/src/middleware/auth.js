const jwt = require('jsonwebtoken');
const Customer = require('../models/customer.model');

exports.protect = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Please authenticate'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token format'
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      return res.status(401).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    req.customer = {
      id: decoded.id
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};