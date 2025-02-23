const jwt = require('jsonwebtoken');
const Supermarket = require('../models/supermarket.model');
const { validateSupermarket } = require('../models/supermarket.model');
const cloudinary = require('../config/cloudinary');


// Admin signup controller
exports.supermarketSignup = async (req, res) => {
  try {
    const { firstName: rawFirstName, lastName: rawLastName, email, password, mobileNumber, supermarketName } = req.body;
    let logoUrl;

    // Validate required fields
    if (!mobileNumber || !supermarketName || !rawFirstName || !rawLastName || !password) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Capitalize first and last names
    const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();
    const lastName = rawLastName.charAt(0).toUpperCase() + rawLastName.slice(1).toLowerCase();

    // Format mobile number to ensure it's just 9 digits
    const formattedMobile = mobileNumber.startsWith('+250') ? mobileNumber.slice(4) : mobileNumber;

    // Validate mobile number format
    if (!/^[0-9]{9}$/.test(formattedMobile)) {
      return res.status(400).json({ message: 'Mobile number must be 9 digits' });
    }

    // Add +250 prefix for database storage
    const mobileWithPrefix = `+250${formattedMobile}`;

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

    // Check if mobile number is already registered
    const existingMobile = await Supermarket.findOne({ 'admin.mobileNumber': mobileWithPrefix });
    if (existingMobile) {
      return res.status(400).json({ message: 'Mobile number is already registered' });
    }

    // Check if email is already registered (if provided)
    if (email) {
      const existingEmail = await Supermarket.findOne({ 'admin.email': email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    // Validate input
    const { error } = validateSupermarket({
      supermarketName: formattedSupermarketName,
      admin: {
        firstName,
        lastName,
        email,
        password,
        mobileNumber: formattedMobile
      }
    });

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Create new supermarket
    const supermarket = new Supermarket({
      supermarketName: formattedSupermarketName,
      admin: {
        firstName,
        lastName,
        email,
        password,
        mobileNumber: mobileWithPrefix
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
    const { email, mobileNumber, password } = req.body;

    if ((!email && !mobileNumber) || !password) {
      return res.status(400).json({ message: 'Email/mobile number and password are required' });
    }

    // Format mobile number with +250 prefix if provided
    const formattedMobile = mobileNumber ? 
      (mobileNumber.startsWith('+250') ? mobileNumber : `+250${mobileNumber}`) : '';

    // Find supermarket by admin email or formatted mobile
    const supermarket = await Supermarket.findOne({
      $or: [
        { 'admin.email': email || '' },
        { 'admin.mobileNumber': formattedMobile }
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
          mobileNumber: supermarket.admin.mobileNumber
        }
      }
    });
  } catch (error) {
    console.error('Supermarket login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};



// Update supermarket profile
exports.updateSupermarket = async (req, res) => {
  try {
    if (!req.admin || !req.admin.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const supermarketId = req.admin.id;
    const { firstName, lastName, email, mobileNumber, supermarketName } = req.body;
    const updateData = {};

    // Find the supermarket
    const supermarket = await Supermarket.findById(supermarketId);
    if (!supermarket) {
      return res.status(404).json({ message: 'Supermarket not found' });
    }

    // Handle supermarket name update
    if (supermarketName) {
      const formattedName = supermarketName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      const existingName = await Supermarket.findOne({
        supermarketName: formattedName,
        _id: { $ne: supermarketId }
      });
      if (existingName) {
        return res.status(400).json({ message: 'Supermarket name is already taken' });
      }
      updateData.supermarketName = formattedName;
    }

    // Handle admin name updates
    if (firstName) {
      updateData['admin.firstName'] = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
    if (lastName) {
      updateData['admin.lastName'] = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
    }

    // Handle mobile number update
    if (mobileNumber) {
      const formattedMobile = mobileNumber.startsWith('+250') ? mobileNumber : `+250${mobileNumber}`;
      if (!/^\+250[0-9]{9}$/.test(formattedMobile)) {
        return res.status(400).json({ message: 'Invalid mobile number format. Must be 9 digits with +250 prefix' });
      }
      if (formattedMobile !== supermarket.admin.mobileNumber) {
        const existingMobile = await Supermarket.findOne({
          'admin.mobileNumber': formattedMobile,
          _id: { $ne: supermarketId }
        });
        if (existingMobile) {
          return res.status(400).json({ message: 'Mobile number is already registered' });
        }
        updateData['admin.mobileNumber'] = formattedMobile;
      }
    }

    // Handle email update
    if (email) {
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      if (email !== supermarket.admin.email) {
        const existingEmail = await Supermarket.findOne({
          'admin.email': email.toLowerCase(),
          _id: { $ne: supermarketId }
        });
        if (existingEmail) {
          return res.status(400).json({ message: 'Email is already registered' });
        }
        updateData['admin.email'] = email.toLowerCase();
      }
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
        // Convert buffer to base64 string
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64Image, {
          folder: 'lemoncart/supermarket_logos',
          resource_type: 'auto',
          public_id: `${supermarketId}_logo_${Date.now()}` // Add unique identifier
        });
        updateData.logo = result.secure_url;
      } catch (uploadError) {
        console.error('Logo upload error:', uploadError);
        return res.status(500).json({ message: 'Error uploading logo' });
      }
    }

    // Update supermarket if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    const updatedSupermarket = await Supermarket.findByIdAndUpdate(
      supermarketId,
      { $set: updateData },
      { new: true, select: '-admin.password' }
    );

    res.json({
      message: 'Profile changes saved',
      supermarket: updatedSupermarket
    });
  } catch (error) {
    console.error('Supermarket update error:', error);
    res.status(500).json({ message: 'Error updating supermarket profile' });
  }
};