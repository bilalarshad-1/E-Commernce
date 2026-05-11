const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const auditLog = require('../middleware/auditMiddleware');
const sendEmail = require('../utils/emailService');

// Generate JWT Token
const sendTokenResponse = (user, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Register first user as super-admin
// @route   POST /api/auth/register-first
// @access  Public
exports.registerFirstUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if any user exists
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'First user already registered. Please use admin to create new users.',
      });
    }

    // Only super-admin role allowed for first user
    const user = await User.create({
      name,
      email,
      password,
      role: 'super-admin',
    });

    // Create audit log (without req.user for first registration)
    const auditEntry = new (require('../models/AuditLog'))({
      user: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'REGISTER',
      entity: 'User',
      entityId: user._id,
      details: { registrationType: 'first-user-super-admin' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'SUCCESS',
    });
    await auditEntry.save();

    sendTokenResponse(user, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Register new user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      createdBy: req.user._id,
    });

    await auditLog(req, 'CREATE', 'User', user._id, { 
      createdUser: { name, email, role: user.role } 
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    await auditLog(req, 'CREATE', 'User', null, { error: error.message }, 'FAILED');
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      await auditLog(req, 'LOGIN', 'User', null, { email, reason: 'User not found' }, 'FAILED');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      await auditLog(req, 'LOGIN', 'User', user._id, { reason: 'Account deactivated' }, 'FAILED');
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await auditLog(req, 'LOGIN', 'User', user._id, { reason: 'Invalid password' }, 'FAILED');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    await auditLog(req, 'LOGIN', 'User', user._id, { login: 'successful' });
    sendTokenResponse(user, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>This link expires in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message,
      });

      await auditLog(req, 'UPDATE', 'User', user._id, { action: 'forgot-password-email-sent' });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent',
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await auditLog(req, 'PASSWORD_CHANGE', 'User', user._id, { action: 'password-reset' });

    sendTokenResponse(user, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    await auditLog(req, 'PASSWORD_CHANGE', 'User', user._id, { action: 'password-changed-by-user' });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  await auditLog(req, 'LOGOUT', 'User', req.user._id, { logout: 'successful' });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
};