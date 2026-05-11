const User = require('../models/User');
const auditLog = require('../middleware/auditMiddleware');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    let query;
    
    // Copy req.query
    const reqQuery = { ...req.query };
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    query = User.find(JSON.parse(queryStr));
    
    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments();
    
    query = query.skip(startIndex).limit(limit);
    
    // Execute query
    const users = await query;
    
    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }
    
    await auditLog(req, 'VIEW', 'User', null, { action: 'viewed-users-list' });
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin/Manager
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check authorization
    if (req.user.role === 'manager' && user.role === 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view super-admin',
      });
    }
    
    await auditLog(req, 'VIEW', 'User', user._id, { action: 'viewed-user-details' });
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/SuperAdmin/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Prevent role changes for super-admin if not super-admin
    if (user.role === 'super-admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super-admin can modify super-admin roles',
      });
    }
    
    const oldRole = user.role;
    user.role = role;
    user.updatedAt = Date.now();
    await user.save();
    
    await auditLog(req, 'ROLE_CHANGE', 'User', user._id, { 
      oldRole, 
      newRole: role,
      changedBy: req.user.email 
    });
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private/Admin/Self
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check if user can update
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }
    
    const fieldsToUpdate = {
      name: req.body.name || user.name,
      email: req.body.email || user.email,
      updatedAt: Date.now(),
    };
    
    // Only admin can update isActive status
    if (req.body.isActive !== undefined && ['admin', 'super-admin'].includes(req.user.role)) {
      fieldsToUpdate.isActive = req.body.isActive;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );
    
    await auditLog(req, 'UPDATE', 'User', user._id, { 
      updatedFields: fieldsToUpdate,
      updatedBy: req.user.email 
    });
    
    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Prevent deleting super-admin if not super-admin
    if (user.role === 'super-admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super-admin can delete super-admin',
      });
    }
    
    // Prevent self deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }
    
    await auditLog(req, 'DELETE', 'User', user._id, { 
      deletedUser: { name: user.name, email: user.email, role: user.role },
      deletedBy: req.user.email 
    });
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};