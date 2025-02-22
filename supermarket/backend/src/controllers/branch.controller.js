const Branch = require('../models/branch.model');
const verify = require('../config/vonage');

// Verify branch manager's phone number
/*
exports.verifyManagerPhone = async (req, res) => {
  try {
    const { branchId, code } = req.body;
    
    // Find the branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if verification is pending
    if (!branch.manager.verificationRequestId) {
      return res.status(400).json({
        success: false,
        message: 'No verification request pending'
      });
    }

    // Verify the code using Vonage
    const result = await verify.check(branch.manager.verificationRequestId, code);

    if (result.status === '0') {
      // Update branch manager's phone verification status
      branch.manager.phoneVerified = true;
      branch.manager.verificationRequestId = null;
      await branch.save();

      return res.status(200).json({
        success: true,
        message: 'Phone number verified successfully',
        data: branch
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
*/

// Create a new branch
exports.createBranch = async (req, res) => {
  try {
    const { manager, name, location } = req.body;
    
    // Create new branch with manager details
    const branch = new Branch({
      manager,
      name,
      location,
      createdBy: req.admin.id
    });

    await branch.save();

    /* Commenting out phone verification
    try {
      const result = await verify.request({
        to: manager.phone,
        brand: "LemonCart"
      });

      if (result.status === '0') {
        branch.manager.verificationRequestId = result.request_id;
        await branch.save();
      } else {
        console.error('Failed to send verification SMS:', result);
      }
    } catch (verifyError) {
      console.error('Vonage verification error:', verifyError);
    }
    */

    res.status(201).json({
      success: true,
      data: branch
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Branch name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().populate('createdBy', 'username email');
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
    const branch = await Branch.findById(req.params.id).populate('createdBy', 'username email');
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

    // Check authorization - allow both admin and branch manager
    const isAdmin = req.admin && req.admin.id === branch.createdBy.toString();
    const isBranchManager = req.admin && 
                          req.admin.role === 'branch_manager' && 
                          req.admin.phoneNumber === branch.manager.phoneNumber;

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
      
      // Update manager fields
      if (req.body.manager.firstName) updateData.manager.firstName = req.body.manager.firstName;
      if (req.body.manager.lastName) updateData.manager.lastName = req.body.manager.lastName;
      if (req.body.manager.email) updateData.manager.email = req.body.manager.email;
      
      // Phone number updates require verification
      if (req.body.manager.phoneNumber) {
        updateData.manager.phoneNumber = req.body.manager.phoneNumber;
        updateData.manager.phoneVerified = false;
      }
      
      // Password updates
      if (req.body.manager.password) {
        updateData.manager.password = req.body.manager.password;
      }
    }

    // Handle other fields
    if (req.body.name) updateData.name = req.body.name;
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Branch name already exists'
      });
    }
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

    // Check if the user is an admin
    if (!req.admin || req.admin.role === 'branch_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete branches'
      });
    }

    // Perform the actual deletion
    await Branch.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};