// models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
action: {
  type: String,
  required: true,
  enum: [
    // =====================
    // CORE SYSTEM ACTIONS
    // =====================
    'CREATE',
    'UPDATE',
    'DELETE',
    'VIEW',

    // =====================
    // AUTH ACTIONS
    // =====================
    'LOGIN',
    'LOGOUT',
    'REGISTER',
    'PASSWORD_CHANGE',
    'ROLE_CHANGE',

    // =====================
    // PRODUCT ACTIONS
    // =====================
    'PRODUCT_CREATE',
    'PRODUCT_UPDATE',
    'PRODUCT_DELETE',
    'PRODUCT_VIEW',

    // =====================
    // CATEGORY ACTIONS
    // =====================
    'CATEGORY_CREATE',
    'CATEGORY_UPDATE',
    'CATEGORY_DELETE',
    'CATEGORY_VIEW',

    // =====================
    // INVENTORY / STOCK
    // =====================
    'STOCK_UPDATE',

    // =====================
    // MEDIA ACTIONS
    // =====================
    'IMAGE_UPLOAD',
    'IMAGE_DELETE',

    // =====================
    // BARCODE / QR
    // =====================
    'BARCODE_GENERATE',
    'QR_GENERATE',

    // =====================
    // CUSTOMER ACTIONS
    // =====================
    'CUSTOMER_CREATE',
    'CUSTOMER_UPDATE',
    'CUSTOMER_DELETE',
    'CUSTOMER_VIEW'
  ]
}
  entity: {
    type: String,
    required: true,
    enum: ['User', 'Product', 'Category', 'Order', 'Setting', 'AuditLog']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entity'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);