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
// Update the action enum to include product actions
action: {
  type: String,
  required: true,
  enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 
         'ROLE_CHANGE', 'VIEW', 'REGISTER', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 
         'PRODUCT_DELETE', 'PRODUCT_VIEW', 'STOCK_UPDATE', 'BARCODE_GENERATE', 
         'QR_GENERATE', 'IMAGE_UPLOAD', 'IMAGE_DELETE'],
},
  entity: {
    type: String,
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: Object,
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

// Index for efficient querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);