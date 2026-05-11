const AuditLog = require('../models/AuditLog');

// Convert action to entity
const getEntityFromAction = (action) => {
  if (action.includes('PRODUCT')) return 'Product';
  if (action.includes('USER')) return 'User';
  if (action.includes('ORDER')) return 'Order';
  if (action.includes('CATEGORY')) return 'Category';

  return 'Unknown';
};

const auditLog = async (
  req,
  action,
  entityId = null,
  details = {},
  status = 'SUCCESS'
) => {
  try {
    const entity = getEntityFromAction(action);

    const auditEntry = new AuditLog({
      user: req.user ? req.user._id : null,

      userEmail: req.user ? req.user.email : 'system',

      userRole: req.user ? req.user.role : 'system',

      action,

      entity,

      entityId,

      details,

      ipAddress:
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress,

      userAgent: req.get('user-agent'),

      status,
    });

    await auditEntry.save();
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = auditLog;