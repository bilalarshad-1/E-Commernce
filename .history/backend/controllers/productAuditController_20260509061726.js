const AuditLog = require('../models/AuditLog');

exports.getProductAuditLogs = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const logs = await AuditLog.find({ 
      entity: 'Product',
      entityId: productId 
    })
    .sort('-timestamp')
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name email');
    
    const total = await AuditLog.countDocuments({ 
      entity: 'Product',
      entityId: productId 
    });
    
    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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