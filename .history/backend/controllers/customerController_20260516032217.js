const Customer = require('../models/Customer');
const CustomerAuditLog = require('../models/CustomerAuditLog');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');
const { cloudinary } = require('../config/cloudinary');

// Generate JWT Token
const sendTokenResponse = (customer, statusCode, res) => {
  const token = jwt.sign(
    { id: customer._id, role: 'customer' }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE }
  );

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.status(statusCode).json({
    success: true,
    token,
    customer: {
      id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      isEmailVerified: customer.isEmailVerified,
      profileImage: customer.profileImage
    }
  });
};

// Create audit log
const createAuditLog = async (req, customerId, customerEmail, action, details = {}, status = 'SUCCESS') => {
  try {
    const auditLog = new CustomerAuditLog({
      customer: customerId,
      customerEmail,
      action,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status
    });
    await auditLog.save();
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// @desc    Register customer
// @route   POST /api/customers/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if customer exists
    const customerExists = await Customer.findOne({ email });
    if (customerExists) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists with this email'
      });
    }

    // Create customer
    const customer = await Customer.create({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    // Generate email verification token
    const verificationToken = customer.getEmailVerificationToken();
    await customer.save();

    // Send verification email
    const verificationUrl = `${process.env.CUSTOMER_FRONTEND_URL}/verify-email/${verificationToken}`;
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to Our Store!</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <p><a href="${verificationUrl}" class="button">Verify Email Address</a></p>
          <p>Or copy and paste this link: ${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: customer.email,
        subject: 'Verify Your Email Address',
        message
      });
    } catch (err) {
      console.error('Email error:', err);
    }

    await createAuditLog(req, customer._id, customer.email, 'REGISTER', {
      firstName,
      lastName,
      email
    });

    sendTokenResponse(customer, 201, res);
  } catch (error) {
    await createAuditLog(req, null, req.body.email, 'REGISTER', { error: error.message }, 'FAILED');
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Login customer
// @route   POST /api/customers/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for customer
    const customer = await Customer.findOne({ email }).select('+password');
    
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (customer.isLocked()) {
      const remainingTime = Math.ceil((customer.lockUntil - Date.now()) / 60000);
      return res.status(401).json({
        success: false,
        message: `Account is locked. Please try again in ${remainingTime} minutes`
      });
    }

    // Check password
    const isMatch = await customer.matchPassword(password);
    
    if (!isMatch) {
      await customer.incrementLoginAttempts();
      await createAuditLog(req, customer._id, customer.email, 'LOGIN', { reason: 'Invalid password' }, 'FAILED');
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    await customer.resetLoginAttempts();
    
    // Update last login info
    customer.lastLogin = Date.now();
    customer.lastLoginIP = req.ip;
    await customer.save();

    await createAuditLog(req, customer._id, customer.email, 'LOGIN', {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    sendTokenResponse(customer, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Verify email
// @route   GET /api/customers/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const customer = await Customer.findOne({
      emailVerificationToken: verificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    customer.isEmailVerified = true;
    customer.emailVerificationToken = undefined;
    customer.emailVerificationExpire = undefined;
    await customer.save();

    await createAuditLog(req, customer._id, customer.email, 'EMAIL_VERIFY', {
      verifiedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/customers/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (customer.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    const verificationToken = customer.getEmailVerificationToken();
    await customer.save();

    const verificationUrl = `${process.env.CUSTOMER_FRONTEND_URL}/verify-email/${verificationToken}`;
    const message = `
      <h2>Verify Your Email Address</h2>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `;

    await sendEmail({
      email: customer.email,
      subject: 'Verify Your Email Address',
      message
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/customers/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const resetToken = customer.getResetPasswordToken();
    await customer.save();

    const resetUrl = `${process.env.CUSTOMER_FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
          .warning { color: #e53e3e; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello ${customer.firstName},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <p><a href="${resetUrl}" class="button">Reset Password</a></p>
          <p>Or copy and paste this link: ${resetUrl}</p>
          <p class="warning">This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: customer.email,
        subject: 'Password Reset Request',
        message
      });

      await createAuditLog(req, customer._id, customer.email, 'PASSWORD_RESET', {
        action: 'forgot-password-email-sent'
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (err) {
      customer.resetPasswordToken = undefined;
      customer.resetPasswordExpire = undefined;
      await customer.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/customers/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const customer = await Customer.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    customer.password = req.body.password;
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpire = undefined;
    await customer.save();

    await createAuditLog(req, customer._id, customer.email, 'PASSWORD_RESET', {
      action: 'password-reset-successful'
    });

    sendTokenResponse(customer, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Change password (authenticated)
// @route   PUT /api/customers/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('+password');

    // Check current password
    const isMatch = await customer.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    customer.password = req.body.newPassword;
    await customer.save();

    await createAuditLog(req, customer._id, customer.email, 'PASSWORD_CHANGE', {
      action: 'password-changed-by-customer'
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get current customer profile
// @route   GET /api/customers/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id)
      .select('-password');

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customers/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'newsletter', 'language', 'currency'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const customer = await Customer.findByIdAndUpdate(
      req.customer.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    await createAuditLog(req, customer._id, customer.email, 'PROFILE_UPDATE', {
      updatedFields: Object.keys(updates)
    });

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/customers/profile/image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const customer = await Customer.findById(req.customer.id);

    // Delete old image if exists
    if (customer.profileImage && customer.profileImage.publicId) {
      await cloudinary.uploader.destroy(customer.profileImage.publicId);
    }

    customer.profileImage = {
      url: req.file.path,
      publicId: req.file.filename
    };
    await customer.save();

    await createAuditLog(req, customer._id, customer.email, 'PROFILE_UPDATE', {
      action: 'uploaded-profile-image'
    });

    res.status(200).json({
      success: true,
      data: customer.profileImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Address Management
// @desc    Add address
// @route   POST /api/customers/addresses
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);

    // If this is default, remove default from other addresses
    if (req.body.isDefault) {
      customer.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    customer.addresses.push(req.body);
    await customer.save();

    await createAuditLog(req, customer._id, customer.email, 'ADDRESS_ADD', {
      address: req.body
    });

    res.status(201).json({
      success: true,
      data: customer.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update address
// @route   PUT /api/customers/addresses/:addressId
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);
    const address = customer.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If setting as default, remove default from others
    if (req.body.isDefault && !address.isDefault) {
      customer.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update address fields
    Object.keys(req.body).forEach(key => {
      address[key] = req.body[key];
    });

    await customer.save();

    await createAuditLog(req, customer._id, customer.email, 'ADDRESS_UPDATE', {
      addressId: req.params.addressId,
      updatedFields: Object.keys(req.body)
    });

    res.status(200).json({
      success: true,
      data: customer.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/customers/addresses/:addressId
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);
    const address = customer.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    address.remove();
    await customer.save();

    await createAuditLog(req, customer._id, customer.email, 'ADDRESS_DELETE', {
      addressId: req.params.addressId
    });

    res.status(200).json({
      success: true,
      data: customer.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Wishlist Management
// @desc    Add to wishlist
// @route   POST /api/customers/wishlist/:productId
// @access  Private
exports.addToWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);
    
    if (!customer.wishlist.includes(req.params.productId)) {
      customer.wishlist.push(req.params.productId);
      await customer.save();

      await createAuditLog(req, customer._id, customer.email, 'WISHLIST_ADD', {
        productId: req.params.productId
      });
    }

    res.status(200).json({
      success: true,
      data: customer.wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Remove from wishlist
// @route   DELETE /api/customers/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);
    customer.wishlist = customer.wishlist.filter(
      id => id.toString() !== req.params.productId
    );
    await customer.save();

    await createAuditLog(req, customer._id, customer.email, 'WISHLIST_REMOVE', {
      productId: req.params.productId
    });

    res.status(200).json({
      success: true,
      data: customer.wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get wishlist
// @route   GET /api/customers/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).populate('wishlist');
    
    res.status(200).json({
      success: true,
      data: customer.wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);
    
    res.status(200).json({
      success: true,
      data: {
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        wishlistCount: customer.wishlist.length,
        addressesCount: customer.addresses.length,
        memberSince: customer.createdAt,
        lastLogin: customer.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Logout customer
// @route   GET /api/customers/logout
// @access  Private
exports.logout = async (req, res) => {
  await createAuditLog(req, req.customer.id, req.customer.email, 'LOGOUT', {
    logout: 'successful'
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};