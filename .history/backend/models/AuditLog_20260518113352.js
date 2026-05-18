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
      'PASSWORD_RESET',
      'ROLE_CHANGE',
      'PERMISSION_UPDATE',

      // =====================
      // PRODUCT ACTIONS
      // =====================
      'PRODUCT_CREATE',
      'PRODUCT_UPDATE',
      'PRODUCT_DELETE',
      'PRODUCT_VIEW',
      'PRODUCT_PUBLISH',
      'PRODUCT_UNPUBLISH',
      'PRODUCT_FEATURE_TOGGLE',
      'PRODUCT_HOTSALE_TOGGLE',
      'PRODUCT_RATING_UPDATE',
      
      // =====================
      // PRODUCT IMAGE ACTIONS
      // =====================
      'PRODUCT_MAIN_IMAGE_UPLOAD',
      'PRODUCT_MAIN_IMAGE_UPDATE',
      'PRODUCT_MAIN_IMAGE_DELETE',
      'PRODUCT_GALLERY_IMAGE_UPLOAD',
      'PRODUCT_GALLERY_IMAGE_UPDATE',
      'PRODUCT_GALLERY_IMAGE_DELETE',
      'PRODUCT_GALLERY_REORDER',
      'PRODUCT_THUMBNAIL_UPLOAD',
      'PRODUCT_THUMBNAIL_DELETE',
      'PRODUCT_HOVER_IMAGE_UPLOAD',
      'PRODUCT_HOVER_IMAGE_DELETE',
      
      // =====================
      // COLOR VARIANT IMAGE ACTIONS
      // =====================
      'COLOR_VARIANT_CREATE',
      'COLOR_VARIANT_UPDATE',
      'COLOR_VARIANT_DELETE',
      'COLOR_IMAGES_UPLOAD',
      'COLOR_IMAGE_DELETE',
      'COLOR_MAIN_IMAGE_SET',

      // =====================
      // VARIATION ACTIONS
      // =====================
      'VARIATION_CREATE',
      'VARIATION_UPDATE',
      'VARIATION_DELETE',

      // =====================
      // CATEGORY ACTIONS
      // =====================
      'CATEGORY_CREATE',
      'CATEGORY_UPDATE',
      'CATEGORY_DELETE',
      'CATEGORY_VIEW',

      // =====================
      // SEO ACTIONS
      // =====================
      'SEO_UPDATE',
      'SEO_BULK_UPDATE',

      // =====================
      // REVIEW ACTIONS
      // =====================
      'REVIEW_CREATE',
      'REVIEW_UPDATE',
      'REVIEW_DELETE',
      'REVIEW_APPROVE',
      'REVIEW_REJECT',

      // =====================
      // BULK OPERATIONS
      // =====================
      'BULK_CATEGORY_ASSIGN',
      'BULK_FLAG_UPDATE',
      'BULK_DELETE',

      // =====================
      // CUSTOMER ACTIONS
      // =====================
      'CUSTOMER_CREATE',
      'CUSTOMER_UPDATE',
      'CUSTOMER_DELETE',
      'CUSTOMER_VIEW',
      'CUSTOMER_BLOCK',
      'CUSTOMER_UNBLOCK'
    ]
  },
  entity: {
    type: String,
    required: true,
    enum: ['User', 'Product', 'Category', 'Order', 'Setting', 'AuditLog', 'Review']
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
auditLogSchema.index({ status: 1 });
auditLogSchema.index({ createdAt: -1 });

// Compound indexes for common queries
auditLogSchema.index({ entity: 1, entityId: 1, action: 1 });
auditLogSchema.index({ user: 1, action: 1, timestamp: -1 });

// Static method to get product audit trail
auditLogSchema.statics.getProductAuditTrail = async function(productId, options = {}) {
  const { limit = 50, skip = 0, action } = options;
  
  const query = { entity: 'Product', entityId: productId };
  if (action) query.action = action;
  
  const logs = await this.find(query)
    .sort('-timestamp')
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email role');
  
  const total = await this.countDocuments(query);
  
  return { logs, total };
};

// Static method to get image audit logs
auditLogSchema.statics.getImageAuditLogs = async function(productId, options = {}) {
  const { limit = 50, skip = 0 } = options;
  
  const imageActions = [
    'PRODUCT_MAIN_IMAGE_UPLOAD',
    'PRODUCT_MAIN_IMAGE_UPDATE',
    'PRODUCT_MAIN_IMAGE_DELETE',
    'PRODUCT_GALLERY_IMAGE_UPLOAD',
    'PRODUCT_GALLERY_IMAGE_UPDATE',
    'PRODUCT_GALLERY_IMAGE_DELETE',
    'PRODUCT_GALLERY_REORDER',
    'COLOR_IMAGES_UPLOAD',
    'COLOR_IMAGE_DELETE',
    'COLOR_MAIN_IMAGE_SET'
  ];
  
  const logs = await this.find({
    entity: 'Product',
    entityId: productId,
    action: { $in: imageActions }
  })
    .sort('-timestamp')
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email');
  
  const total = await this.countDocuments({
    entity: 'Product',
    entityId: productId,
    action: { $in: imageActions }
  });
  
  return { logs, total };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);