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

// Get single branch
exports.getBranch = async (req, res) => {
  try {
    const branch = await Branch.findOne({
      _id: req.params.id,
      createdBy: req.admin.id
    }).populate('createdBy', 'username email');
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
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
    const isAdmin = req.admin && req.admin.role === 'admin' && req.admin.id === branch.createdBy.toString();
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

    // Handle manager updates
    if (req.body.manager && typeof req.body.manager === 'object') {
      // Start with existing manager data
      updateData.manager = { ...branch.manager.toObject() };

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
      
      // Update manager fields
      if (req.body.manager.firstName) updateData.manager.firstName = req.body.manager.firstName;
      if (req.body.manager.lastName) updateData.manager.lastName = req.body.manager.lastName;
      if (req.body.manager.email) updateData.manager.email = req.body.manager.email;
      
      // Mobile number updates require verification
      if (req.body.manager.mobileNumber) {
        // Format mobile number if needed
        const formattedMobile = req.body.manager.mobileNumber.startsWith('+250') ? 
          req.body.manager.mobileNumber : 
          `+250${req.body.manager.mobileNumber}`;

        // Validate mobile number format
        if (!/^\+250[0-9]{9}$/.test(formattedMobile)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid mobile number format. Must be 9 digits with +250 prefix'
          });
        }

        updateData.manager.mobileNumber = formattedMobile;
        updateData.manager.phoneVerified = false;
      }
      
      // Password updates
      if (req.body.manager.password) {
        updateData.manager.password = req.body.manager.password;
      }
    }

    // Handle other fields
    if (req.body.branchName) updateData.branchName = req.body.branchName;
    if (req.body.location) updateData.location = req.body.location;
    if (typeof req.body.active === 'boolean') updateData.active = req.body.active;

    // If no valid updates provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update data provided'
      });
    }

    // Update the branch with runValidators set to false for partial updates
    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      data: updatedBranch
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern['branchName'] && error.keyPattern['createdBy']) {
      return res.status(400).json({
        success: false,
        message: 'A branch with this name already exists in your supermarket'
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

// Delete branch (complete deletion, admin only)
exports.deleteBranch = async (req, res) => {
  try {
    // First find the branch to check if it exists
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if the user is an admin and is the one who created the branch
    if (!req.admin || req.admin.role === 'branch_manager' || req.admin.id !== branch.createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the administrator who created this branch can delete it'
      });
    }

    // Perform the actual deletion
    await Branch.findByIdAndDelete(req.params.id);

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