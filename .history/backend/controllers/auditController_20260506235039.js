const AuditLog = require('../models/AuditLog');
const auditLogMiddleware = require('../middleware/auditMiddleware');

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private/Admin/SuperAdmin
exports.getAuditLogs = async (req, res) => {
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
    
    query = AuditLog.find(JSON.parse(queryStr)).populate('user', 'name email');
    
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
      query = query.sort('-timestamp');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await AuditLog.countDocuments();
    
    query = query.skip(startIndex).limit(limit);
    
    // Execute query
    const auditLogs = await query;
    
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
    
    await auditLogMiddleware(req, 'VIEW', 'AuditLog', null, { action: 'viewed-audit-logs' });
    
    res.status(200).json({
      success: true,
      count: auditLogs.length,
      pagination,
      data: auditLogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get user-specific audit logs
// @route   GET /api/audit-logs/user/:userId
// @access  Private/Admin/SuperAdmin
exports.getUserAuditLogs = async (req, res) => {
  try {
    const auditLogs = await AuditLog.find({ user: req.params.userId })
      .sort('-timestamp')
      .populate('user', 'name email');
    
    await auditLogMiddleware(req, 'VIEW', 'AuditLog', null, { 
      action: 'viewed-user-audit-logs',
      userId: req.params.userId 
    });
    
    res.status(200).json({
      success: true,
      count: auditLogs.length,
      data: auditLogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};