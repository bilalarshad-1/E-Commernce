// middleware/auditMiddleware.js
const AuditLog = require('../models/AuditLog');

const auditLog = async (req, action, entity, entityId, details = {}, status = 'SUCCESS') => {
  try {
    // Only log if user is authenticated
    if (!req.user || !req.user._id) {
      return;
    }

    const logData = {
      user: req.user._id,
      action: action,
      entity: entity,
      entityId: entityId,
      details: details,
      status: status,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    await AuditLog.create(logData);
  } catch (error) {
    console.error('Audit log error:', error.message);
    // Don't throw error to avoid breaking the main flow
  }
};

module.exports = auditLog;