const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin.model');
const { validateAdmin } = require('../models/admin.model');
const cloudinary = require('../config/cloudinary');

// Admin signup controller
exports.adminSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, supermarketName } = req.body;
    let logoUrl;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Format phone number to ensure it starts with '+'
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    // Capitalize supermarket name
    const formattedSupermarketName = supermarketName.charAt(0).toUpperCase() + supermarketName.slice(1);

    // Check if supermarket name is already registered
    const existingSupermarket = await Admin.findOne({ supermarketName: formattedSupermarketName });
    if (existingSupermarket) {
      return res.status(400).json({ message: 'Supermarket name is already registered' });
    }

    // Validate input
    const { error } = validateAdmin({ firstName, lastName, email, password, phone: formattedPhone, supermarketName: formattedSupermarketName });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if phone number is already registered
    const existingPhone = await Admin.findOne({ phone: formattedPhone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number is already registered' });
    }

    // Check if email is already registered
    if (email) {
      const existingEmail = await Admin.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    // Create new admin
    const admin = new Admin({
      firstName,
      lastName,
      email,
      password,
      phone: formattedPhone,
      supermarketName: formattedSupermarketName,
      isActive: true,
      logo: logoUrl
    });

    await admin.save();

    res.status(201).json({ message: 'Admin created successfully.' });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Error creating admin account' });
  }
};

// Admin login controller
exports.adminLogin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required' });
    }

    // Find admin by email or phone
    const admin = await Admin.findOne({
      $or: [
        { email: email || '' },
        { phone: phone || '' }
      ]
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }


    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};



// Admin update controller
exports.updateAdmin = async (req, res) => {
  try {
    const adminId = req.admin.id; // Get admin ID from authenticated request
    const { firstName, lastName, email, phone } = req.body;
    let logoUrl;

    // Find the admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Handle logo upload if provided
    if (req.file) {
      // Delete old logo if it exists
      if (admin.logo) {
        try {
          const publicId = admin.logo.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`lemoncart/admin_logos/${publicId}`);
        } catch (deleteError) {
          console.error('Error deleting old logo:', deleteError);
          // Continue with upload even if deletion fails
        }
      }

      try {
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream({
            folder: 'lemoncart/admin_logos',
            use_filename: true
          }, (error, result) => {
            if (error) {
              console.error('Logo upload error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          });
          uploadStream.end(req.file.buffer);
        });

        const uploadResult = await uploadPromise;
        logoUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Logo upload error:', uploadError);
        return res.status(500).json({ message: 'Error uploading logo' });
      }
    }

    // Prepare update object
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (logoUrl) updateData.logo = logoUrl;

    // Handle email update
    if (email && email !== admin.email) {
      const existingEmail = await Admin.findOne({ email, _id: { $ne: adminId } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      updateData.email = email;
    }

    // Handle phone update
    if (phone) {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      if (formattedPhone !== admin.phone) {
        const existingPhone = await Admin.findOne({ phone: formattedPhone, _id: { $ne: adminId } });
        if (existingPhone) {
          return res.status(400).json({ message: 'Phone number is already registered' });
        }

        try {
          // Send verification SMS for new phone number
          const requestId = await sendVerificationSMS(formattedPhone);
          updateData.phone = formattedPhone;
          updateData.isPhoneVerified = false;
          updateData.vonageRequestId = requestId;
        } catch (smsError) {
          console.error('SMS verification error:', smsError);
          return res.status(500).json({ message: 'Error sending verification SMS. Please try again.' });
        }
      }
    }

    // Validate the update data
    const { error } = validateAdmin({ ...admin.toObject(), ...updateData });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Update admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true, select: '-password -vonageRequestId' }
    );

    res.json({
      message: phone && phone !== admin.phone ? 
        'Profile updated successfully. Please verify your new phone number.' :
        'Profile updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('Admin update error:', error);
    res.status(500).json({ message: 'Error updating admin profile' });
  }
};