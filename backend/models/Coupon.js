const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Discount type
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Maximum discount amount (for percentage coupons)
  maxDiscountAmount: {
    type: Number,
    default: 0
  },
  
  // Minimum purchase requirement
  minPurchase: {
    type: Number,
    default: 0
  },
  
  // Usage limits
  usageLimit: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  
  // Date range
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Applicable products/categories
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludeProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Customer eligibility
  eligibleCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  newCustomersOnly: {
    type: Boolean,
    default: false
  },
  
  // Shipping discount
  freeShipping: {
    type: Boolean,
    default: false
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // First order only
  firstOrderOnly: {
    type: Boolean,
    default: false
  },
  
  // Stackable with other coupons
  stackable: {
    type: Boolean,
    default: false
  },
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Metadata
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    orderId: mongoose.Schema.Types.ObjectId,
    usedAt: Date,
    discountAmount: Number
  }]
}, {
  timestamps: true
});

// Check if coupon is valid
couponSchema.methods.isValid = async function(userId = null, subtotal = 0) {
  // Check active status
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  
  // Check date range
  const now = new Date();
  if (now < this.startDate) return { valid: false, message: 'Coupon has not started yet' };
  if (now > this.endDate) return { valid: false, message: 'Coupon has expired' };
  
  // Check usage limit
  if (this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit has been reached' };
  }
  
  // Check minimum purchase
  if (subtotal < this.minPurchase) {
    return { valid: false, message: `Minimum purchase of $${this.minPurchase} required` };
  }
  
  // Check user eligibility
  if (userId && this.eligibleCustomers.length > 0) {
    if (!this.eligibleCustomers.includes(userId)) {
      return { valid: false, message: 'Coupon is not valid for your account' };
    }
  }
  
  // Check user usage limit
  if (userId) {
    const userUsedCount = this.usedBy.filter(u => u.user && u.user.toString() === userId.toString()).length;
    if (userUsedCount >= this.perUserLimit) {
      return { valid: false, message: 'You have already used this coupon the maximum number of times' };
    }
  }
  
  return { valid: true, message: 'Coupon is valid' };
};

// Calculate discount
couponSchema.methods.calculateDiscount = function(subtotal) {
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maxDiscountAmount > 0 && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else {
    discount = Math.min(this.discountValue, subtotal);
  }
  
  return discount;
};

module.exports = mongoose.model('Coupon', couponSchema);