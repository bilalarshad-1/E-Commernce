const AuditLog = require('../models/AuditLog');
const Product = require('../models/Product');

// @desc    Get product audit logs
// @route   GET /api/audit-logs/products/:productId
// @access  Private/Admin/SuperAdmin
exports.getProductAuditLogs = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { action, startDate, endDate } = req.query;
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Build query
    const query = { 
      entity: 'Product',
      entityId: productId 
    };
    
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const logs = await AuditLog.find(query)
      .sort('-timestamp')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role');
    
    const total = await AuditLog.countDocuments(query);
    
    // Get summary statistics
    const summary = await AuditLog.aggregate([
      { $match: { entity: 'Product', entityId: product._id } },
      { $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }},
      { $sort: { lastOccurrence: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.productName,
          slug: product.slug
        },
        logs,
        summary,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get product audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get product image audit logs
// @route   GET /api/audit-logs/products/:productId/images
// @access  Private/Admin/SuperAdmin
exports.getProductImageAuditLogs = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const { logs, total } = await AuditLog.getImageAuditLogs(productId, {
      skip: (page - 1) * limit,
      limit
    });
    
    // Group by image type
    const imageStats = {
      mainImage: logs.filter(l => l.action.includes('MAIN_IMAGE')).length,
      gallery: logs.filter(l => l.action.includes('GALLERY')).length,
      thumbnail: logs.filter(l => l.action.includes('THUMBNAIL')).length,
      hover: logs.filter(l => l.action.includes('HOVER_IMAGE')).length,
      colorImages: logs.filter(l => l.action.includes('COLOR')).length
    };
    
    res.status(200).json({
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.productName
        },
        stats: imageStats,
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get product image audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get product audit summary
// @route   GET /api/audit-logs/products/summary
// @access  Private/Admin/SuperAdmin
exports.getProductAuditSummary = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch(timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get product audit summary
    const summary = await AuditLog.aggregate([
      { 
        $match: { 
          entity: 'Product',
          timestamp: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: {
            action: '$action',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.action',
          success: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'SUCCESS'] }, '$count', 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'FAILED'] }, '$count', 0]
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    // Get daily activity
    const dailyActivity = await AuditLog.aggregate([
      {
        $match: {
          entity: 'Product',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get top active products
    const topActiveProducts = await AuditLog.aggregate([
      {
        $match: {
          entity: 'Product',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$entityId',
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { activityCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $project: {
          productId: '$_id',
          productName: { $arrayElemAt: ['$product.productName', 0] },
          activityCount: 1,
          lastActivity: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        timeframe,
        startDate,
        summary,
        dailyActivity,
        topActiveProducts
      }
    });
  } catch (error) {
    console.error('Get product audit summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

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
    
    query = AuditLog.find(JSON.parse(queryStr)).populate('user', 'name email role');
    
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
    
    res.status(200).json({
      success: true,
      count: auditLogs.length,
      pagination,
      data: auditLogs,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user-specific audit logs
// @route   GET /api/audit-logs/user/:userId
// @access  Private/Admin/SuperAdmin
exports.getUserAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const auditLogs = await AuditLog.find({ user: req.params.userId })
      .sort('-timestamp')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role');
    
    const total = await AuditLog.countDocuments({ user: req.params.userId });
    
    res.status(200).json({
      success: true,
      data: auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get audit log by ID
// @route   GET /api/audit-logs/:id
// @access  Private/Admin/SuperAdmin
exports.getAuditLogById = async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id)
      .populate('user', 'name email role');
    
    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    console.error('Get audit log by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get audit statistics
// @route   GET /api/audit-logs/stats/overview
// @access  Private/Admin/SuperAdmin
exports.getAuditStats = async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    
    // Stats by action type
    const actionStats = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    // Stats by entity
    const entityStats = await AuditLog.aggregate([
      { $group: { _id: '$entity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Success/Failure rate
    const statusStats = await AuditLog.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Activity by hour
    const hourlyActivity = await AuditLog.aggregate([
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        actionStats,
        entityStats,
        statusStats,
        hourlyActivity,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Export audit logs
// @route   GET /api/audit-logs/export
// @access  Private/Admin/SuperAdmin
exports.exportAuditLogs = async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, entity, action } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (entity) query.entity = entity;
    if (action) query.action = action;
    
    const logs = await AuditLog.find(query)
      .sort('-timestamp')
      .populate('user', 'name email role')
      .lean();
    
    if (format === 'csv') {
      // Convert to CSV
      const csvHeaders = ['Timestamp', 'User', 'Email', 'Action', 'Entity', 'Entity ID', 'Status', 'IP Address', 'Details'];
      const csvRows = logs.map(log => [
        log.timestamp,
        log.user?.name || 'Unknown',
        log.user?.email || 'Unknown',
        log.action,
        log.entity,
        log.entityId,
        log.status,
        log.ipAddress || '',
        JSON.stringify(log.details)
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      return res.send(csvContent);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs
      });
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};