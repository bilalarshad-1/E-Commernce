const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: String,
  sku: String,
  variation: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    sku: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  buyPrice: {
    type: Number,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  }
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: String,
  phone: {
    type: String,
    required: true
  },
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: String,
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'US'
  },
  addressType: {
    type: String,
    enum: ['shipping', 'billing', 'both'],
    default: 'shipping'
  }
});

const paymentDetailsSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cod', 'card', 'paypal', 'stripe', 'razorpay', 'bank_transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: String,
  paymentId: String,
  payerId: String,
  cardDetails: {
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number
  },
  paidAt: Date,
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  refundedAt: Date
});

const timelineSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    required: true
  },
  message: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customerNotified: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  guestInfo: {
    email: String,
    phone: String,
    firstName: String,
    lastName: String
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  
  // Order Items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: String,
  couponDiscount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  taxDetails: {
    type: Object
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Shipping & Billing
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema,
  
  // Payment
  payment: paymentDetailsSchema,
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending'
  },
  timeline: [timelineSchema],
  
  // Shipping Tracking
  tracking: {
    number: String,
    carrier: String,
    url: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },
  
  // Returns & Cancellations
  cancellation: {
    requestedAt: Date,
    reason: String,
    approvedAt: Date,
    approvedBy: mongoose.Schema.Types.ObjectId,
    refundProcessed: Boolean
  },
  return: {
    requestedAt: Date,
    reason: String,
    reasonDetails: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    approvedAt: Date,
    approvedBy: mongoose.Schema.Types.ObjectId,
    refundProcessed: Boolean,
    refundAmount: Number,
    itemsReturned: [{
      itemId: mongoose.Schema.Types.ObjectId,
      quantity: Number,
      reason: String,
      condition: String
    }]
  },
  
  // Notifications
  notifications: {
    orderConfirmed: { type: Boolean, default: false },
    orderShipped: { type: Boolean, default: false },
    orderDelivered: { type: Boolean, default: false },
    orderCancelled: { type: Boolean, default: false }
  },
  
  // Notes
  customerNotes: String,
  adminNotes: String,
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  couponApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  processedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  returnedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.status) && 
         this.orderAge <= 1 && 
         this.payment.status !== 'refunded';
});

// Virtual for can be returned
orderSchema.virtual('canBeReturned').get(function() {
  return this.status === 'delivered' && 
         this.orderAge <= 30 && 
         this.return.status === 'pending';
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Order').countDocuments() + 1;
    this.orderNumber = `ORD-${year}${month}-${String(count).padStart(6, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Order', orderSchema);