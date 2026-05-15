// middleware/auditMiddleware.js
const AuditLog = require('../models/AuditLog');

const auditLog = async (req, action, entity, entityId, details, status = 'SUCCESS') => {
  try {
    // Don't await - let it run in background to not block the response
    const auditEntry = new AuditLog({
      user: req.user?._id,
      action: action,
      entity: entity,
      entityId: entityId,
      details: details || {},
      status: status, // This should be a string, not an object
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    await auditEntry.save();
  } catch (error) {
    console.error('Audit log error:', error.message);
    // Don't throw - audit logging shouldn't break the main flow
  }
};

module.exports = auditLog;