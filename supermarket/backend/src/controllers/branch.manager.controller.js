const Branch = require('../models/branch.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Branch manager login
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Find branch by manager's phone number
    const branch = await Branch.findOne({ 'manager.phoneNumber': phoneNumber, active: true });
    if (!branch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, branch.manager.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    branch.manager.lastLogin = new Date();
    await branch.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: branch._id,
        role: 'branch_manager',
        phoneNumber: branch.manager.phoneNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        branchId: branch._id,
        name: branch.name,
        manager: {
          firstName: branch.manager.firstName,
          lastName: branch.manager.lastName,
          phoneNumber: branch.manager.phoneNumber,
          email: branch.manager.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};