const jwt = require('jsonwebtoken');
const Supermarket = require('../models/supermarket.model');
const { validateSupermarket } = require('../models/supermarket.model');
const cloudinary = require('../config/cloudinary');


// Admin signup controller
exports.supermarketSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, supermarketName } = req.body;
    let logoUrl;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Format phone number to ensure it's just 9 digits
    const formattedPhone = phone.startsWith('+250') ? phone.slice(4) : phone;

    // Add +250 prefix for database storage
    const phoneWithPrefix = `+250${formattedPhone}`;

    // Capitalize each word in supermarket name
    const formattedSupermarketName = supermarketName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Check if supermarket name is already registered
    const existingSupermarket = await Supermarket.findOne({ supermarketName: formattedSupermarketName });
    if (existingSupermarket) {
      return res.status(400).json({ message: 'Supermarket name is already registered' });
    }

    // Validate input
    const { error } = validateSupermarket({ supermarketName: formattedSupermarketName, admin: { firstName, lastName, email, password, phone: formattedPhone } });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if phone number is already registered
    const existingPhone = await Supermarket.findOne({ 'admin.phone': phoneWithPrefix });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number is already registered' });
    }

    // Check if email is already registered
    if (email) {
      const existingEmail = await Supermarket.findOne({ 'admin.email': email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    // Create new supermarket
    const supermarket = new Supermarket({
      supermarketName: formattedSupermarketName,
      admin: {
        firstName,
        lastName,
        email,
        password,
        phone: phoneWithPrefix
      },
      isActive: true,
      logo: logoUrl
    });

    await supermarket.save();

    res.status(201).json({ message: 'Supermarket account created successfully.' });
  } catch (error) {
    console.error('Supermarket signup error:', error);
    res.status(500).json({ message: 'Error creating supermarket account' });
  }
};

// Admin login controller
exports.supermarketLogin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required' });
    }

    // Find supermarket by admin email or phone
    const supermarket = await Supermarket.findOne({
      $or: [
        { 'admin.email': email || '' },
        { 'admin.phone': phone || '' }
      ]
    });

    if (!supermarket) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await supermarket.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: supermarket._id,
        isAdmin: true,
        supermarketName: supermarket.supermarketName 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      supermarket: {
        id: supermarket._id,
        supermarketName: supermarket.supermarketName,
        admin: {
          firstName: supermarket.admin.firstName,
          lastName: supermarket.admin.lastName,
          email: supermarket.admin.email,
          phone: supermarket.admin.phone
        }
      }
    });
  } catch (error) {
    console.error('Supermarket login error:', error);
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
      const formattedPhone = phone.startsWith('+250') ? phone : `+250${phone}`;
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
// Update supermarket profile
exports.updateSupermarket = async (req, res) => {
  try {
    const supermarketId = req.admin.id;
    const { firstName, lastName, email, phone, supermarketName } = req.body;
    let logoUrl;

    // Find the supermarket
    const supermarket = await Supermarket.findById(supermarketId);
    if (!supermarket) {
      return res.status(404).json({ message: 'Supermarket not found' });
    }

    // Handle logo upload if provided
    if (req.file) {
      // Delete old logo if it exists
      if (supermarket.logo) {
        try {
          const publicId = supermarket.logo.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`lemoncart/supermarket_logos/${publicId}`);
        } catch (deleteError) {
          console.error('Error deleting old logo:', deleteError);
          // Continue with upload even if deletion fails
        }
      }

      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'lemoncart/supermarket_logos'
        });
        logoUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Logo upload error:', uploadError);
        return res.status(500).json({ message: 'Error uploading logo' });
      }
    }

    // Prepare update object
    const updateData = {};
    if (supermarketName) {
      const formattedName = supermarketName.charAt(0).toUpperCase() + supermarketName.slice(1);
      // Check if new name is already taken
      const existingName = await Supermarket.findOne({
        supermarketName: formattedName,
        _id: { $ne: supermarketId }
      });
      if (existingName) {
        return res.status(400).json({ message: 'Supermarket name is already taken' });
      }
      updateData.supermarketName = formattedName;
    }

    // Update admin fields
    if (firstName) updateData['admin.firstName'] = firstName;
    if (lastName) updateData['admin.lastName'] = lastName;
    if (logoUrl) updateData.logo = logoUrl;

    // Handle email update
    if (email && email !== supermarket.admin.email) {
      const existingEmail = await Supermarket.findOne({
        'admin.email': email,
        _id: { $ne: supermarketId }
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      updateData['admin.email'] = email;
    }

    // Handle phone update
    if (phone) {
      const formattedPhone = phone.startsWith('+250') ? phone : `+250${phone}`;
      if (formattedPhone !== supermarket.admin.phone) {
        const existingPhone = await Supermarket.findOne({
          'admin.phone': formattedPhone,
          _id: { $ne: supermarketId }
        });
        if (existingPhone) {
          return res.status(400).json({ message: 'Phone number is already registered' });
        }
        updateData['admin.phone'] = formattedPhone;
      }
    }

    // Update supermarket
    const updatedSupermarket = await Supermarket.findByIdAndUpdate(
      supermarketId,
      { $set: updateData },
      { new: true, select: '-admin.password' }
    );

    res.json({
      message: 'Profile updated successfully',
      supermarket: updatedSupermarket
    });
  } catch (error) {
    console.error('Supermarket update error:', error);
    res.status(500).json({ message: 'Error updating supermarket profile' });
  }
};