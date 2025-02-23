const Branch = require('../models/branch.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// Create a new branch
exports.createBranch = async (req, res) => {
  try {
    // Ensure the user is an admin
    if (!req.admin || req.admin.role === 'branch_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only administrator can create branches'
      });
    }

    const { manager, branchName, location } = req.body;

    // Check if branch name already exists for this supermarket
    const existingBranch = await Branch.findOne({
      createdBy: req.admin.id,
      branchName: branchName
    });

    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: 'A branch with this name already exists'
      });
    }

    // Clean and format the mobile number
    const cleanedMobile = manager.mobileNumber.replace(/\D/g, '').slice(-9);
    const formattedMobile = `+250${cleanedMobile}`;
    
    // Check if mobile number is already in use by another branch manager
    const existingMobileNumber = await Branch.findOne({
      'manager.mobileNumber': formattedMobile
    });

    if (existingMobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'This mobile number is already registered to another branch manager'
      });
    }
    
    // Create new branch with manager details and supermarket reference
    const branch = new Branch({
      manager,
      branchName,
      location,
      createdBy: req.admin.id
    });


    await branch.save();

    res.status(201).json({
      success: true,
      data: branch
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern['branchName'] && error.keyPattern['createdBy']) {
      return res.status(400).json({
        success: false,
        message: 'A branch with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Branch manager login
exports.login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // Clean and format the mobile number
    const cleanedMobile = mobileNumber.replace(/\D/g, '');

    // Find branch by manager's mobile number
    const branch = await Branch.findOne({ 'manager.mobileNumber': `+250${cleanedMobile}`, active: true });
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
        mobileNumber: branch.manager.mobileNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        branchId: branch._id,
        branchName: branch.branchName,
        manager: {
          firstName: branch.manager.firstName,
          lastName: branch.manager.lastName,
          mobileNumber: branch.manager.mobileNumber,
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

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    // If admin, only show branches they created
    const query = { createdBy: req.admin.id };

    const branches = await Branch.find(query).populate('createdBy', 'username email');
    res.status(200).json({
      success: true,
      data: branches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single branch
exports.getBranch = async (req, res) => {
  try {
    // Find the branch first
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check authorization - allow only admin who created the branch and the branch manager
    const isAdmin = req.admin && req.admin.isAdmin && req.admin.id === branch.createdBy.toString();
    const isBranchManager = req.admin && 
                          req.admin.role === 'branch_manager' && 
                          req.admin.mobileNumber === branch.manager.mobileNumber;

    if (!isAdmin && !isBranchManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this branch'
      });
    }

    // Populate creator details if authorized
    await branch.populate('createdBy', 'username email');

    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update branch
exports.updateBranch = async (req, res) => {
  try {
    // Find the branch first
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check authorization - allow only admin who created the branch and the branch manager
    const isAdmin = req.admin && req.admin.isAdmin && req.admin.id === branch.createdBy.toString();
    const isBranchManager = req.admin && 
                          req.admin.role === 'branch_manager' && 
                          req.admin.mobileNumber === branch.manager.mobileNumber;

    if (!isAdmin && !isBranchManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this branch'
      });
    }

    // Prepare update object with only provided fields
    const updateData = {};

    // Handle manager updates
    if (req.body.manager && typeof req.body.manager === 'object') {
      // Start with existing manager data
      updateData.manager = { ...branch.manager.toObject() };

      // Update only provided fields
      if (req.body.manager.firstName) {
        updateData.manager.firstName = req.body.manager.firstName;
      }
      if (req.body.manager.lastName) {
        updateData.manager.lastName = req.body.manager.lastName;
      }
      if (req.body.manager.email) {
        updateData.manager.email = req.body.manager.email;
      }
      if (req.body.manager.password) {
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        updateData.manager.password = await bcrypt.hash(req.body.manager.password, salt);
      }
      if (req.body.manager.mobileNumber) {
        // Format mobile number
        const cleanedMobile = req.body.manager.mobileNumber.replace(/\D/g, '').slice(-9);
        const formattedMobile = `+250${cleanedMobile}`;

        // Check if mobile number is already in use
        const existingMobile = await Branch.findOne({
          _id: { $ne: req.params.id },
          'manager.mobileNumber': formattedMobile
        });

        if (existingMobile) {
          return res.status(400).json({
            success: false,
            message: 'This mobile number is already registered to another branch manager'
          });
        }

        updateData.manager.mobileNumber = formattedMobile;
      }
    }

    // Handle other branch updates
    if (req.body.branchName) {
      // Check if branch name is already in use
      const existingName = await Branch.findOne({
        _id: { $ne: req.params.id },
        createdBy: branch.createdBy,
        branchName: req.body.branchName
      });

      if (existingName) {
        return res.status(400).json({
          success: false,
          message: 'A branch with this name already exists'
        });
      }

      updateData.branchName = req.body.branchName;
    }

    if (req.body.location) {
      updateData.location = req.body.location;
    }

    if (req.body.active !== undefined) {
      updateData.active = req.body.active;
    }

    // Update branch
    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    res.status(200).json({
      success: true,
      data: updatedBranch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete branch
exports.deleteBranch = async (req, res) => {
  try {
    // Ensure the user is an admin
    if (!req.admin || !req.admin.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrator can delete branches'
      });
    }

    // Find and delete the branch
    const branch = await Branch.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.admin.id
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found or not authorized to delete this branch'
      });
    }

    res.status(200).json({
      success: true,
      message: '1 branch deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};