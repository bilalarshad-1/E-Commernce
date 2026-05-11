const AuditLog = require('../models/AuditLog');

const auditLog = async (req, action, entity, entityId = null, details = {}, status = 'SUCCESS') => {
  try {
    const auditEntry = new AuditLog({
      user: req.user ? req.user._id : null,
      userEmail: req.user ? req.user.email : 'system',
      userRole: req.user ? req.user.role : 'system',
      action,
      entity,
      entityId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status,
    });
    await auditEntry.save();
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

module.exports = auditLog;