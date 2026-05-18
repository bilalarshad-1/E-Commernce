const mongoose = require('mongoose');

const taxRuleSchema = new mongoose.Schema({
  name: String,
  country: String,
  state: String,
  city: String,
  postalCode: String,
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  }
});

const taxSettingSchema = new mongoose.Schema({
  globalTaxRate: {
    type: Number,
    default: 0
  },
  taxIncludedInPrice: {
    type: Boolean,
    default: false
  },
  taxRules: [taxRuleSchema],
  applyTaxToShipping: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TaxSetting', taxSettingSchema);