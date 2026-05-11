const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    // REMOVE the enum completely - audit logs shouldn't have strict enums
  },
  entity: {
    type: String,
    required: true,
  },
  entityId: {
    type: String,  // ✅ Changed from ObjectId to String
    default: null,
  },
  details: {
    type: Object,
    default: {},
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS',
  },
});

// Indexes for efficient querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 }); 

module.exports = mongoose.model('AuditLog', auditLogSchema);