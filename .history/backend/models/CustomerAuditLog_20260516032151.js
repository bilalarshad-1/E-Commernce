const mongoose = require('mongoose');

const customerAuditLogSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'REGISTER', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET',
      'EMAIL_VERIFY', 'PROFILE_UPDATE', 'ADDRESS_ADD', 'ADDRESS_UPDATE',
      'ADDRESS_DELETE', 'WISHLIST_ADD', 'WISHLIST_REMOVE', 'ACCOUNT_ACTIVATE',
      'ACCOUNT_DEACTIVATE', 'ACCOUNT_LOCK', 'ACCOUNT_UNLOCK'
    ]
  },
  details: {
    type: Object
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
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS'
  }
});

// Indexes
customerAuditLogSchema.index({ customer: 1, timestamp: -1 });
customerAuditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('CustomerAuditLog', customerAuditLogSchema);