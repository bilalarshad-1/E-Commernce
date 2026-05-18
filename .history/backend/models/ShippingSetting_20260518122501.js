const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['standard', 'express', 'overnight', 'free']
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  minDays: Number,
  maxDays: Number,
  isActive: {
    type: Boolean,
    default: true
  },
  freeShippingThreshold: {
    type: Number,
    default: 0
  }
});

const shippingSettingSchema = new mongoose.Schema({
  methods: [shippingMethodSchema],
  
  // Tax settings
  taxRate: {
    type: Number,
    default: 0
  },
  taxIncluded: {
    type: Boolean,
    default: false
  },
  taxRegions: [{
    region: String,
    rate: Number
  }],
  
  // Shipping zones
  shippingZones: [{
    name: String,
    countries: [String],
    cost: Number,
    freeShippingThreshold: Number
  }],
  
  // Default settings
  defaultShippingMethod: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'free'],
    default: 'standard'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShippingSetting', shippingSettingSchema);