const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

exports.isAdmin = (req, res, next) => {
  if (!req.admin || !req.admin.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required'
    });
  }
  next();
};