const TaxSetting = require('../models/TaxSetting');
const AuditLog = require('../models/AuditLog');

// Create audit log
const createAuditLog = async (userId, action, entity, entityId, details, status = 'SUCCESS', req = null) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entity,
      entityId,
      details,
      status,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent']
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// @desc    Get tax settings
// @route   GET /api/tax/settings
// @access  Public
exports.getTaxSettings = async (req, res) => {
  try {
    let settings = await TaxSetting.findOne();
    
    if (!settings) {
      // Return default settings
      settings = {
        globalTaxRate: 10,
        taxIncludedInPrice: false,
        taxRules: [],
        applyTaxToShipping: false
      };
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    console.error('Get tax settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update tax settings
// @route   PUT /api/tax/settings
// @access  Private/Admin
exports.updateTaxSettings = async (req, res) => {
  try {
    const { globalTaxRate, taxIncludedInPrice, taxRules, applyTaxToShipping } = req.body;
    
    let settings = await TaxSetting.findOne();
    
    if (!settings) {
      settings = new TaxSetting();
    }
    
    if (globalTaxRate !== undefined) settings.globalTaxRate = globalTaxRate;
    if (taxIncludedInPrice !== undefined) settings.taxIncludedInPrice = taxIncludedInPrice;
    if (taxRules !== undefined) settings.taxRules = taxRules;
    if (applyTaxToShipping !== undefined) settings.applyTaxToShipping = applyTaxToShipping;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'UPDATE',
      'TaxSetting',
      settings._id,
      {
        globalTaxRate,
        taxIncludedInPrice,
        taxRulesCount: taxRules?.length,
        applyTaxToShipping
      },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Tax settings updated successfully'
    });
    
  } catch (error) {
    console.error('Update tax settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Add tax rule
// @route   POST /api/tax/rules
// @access  Private/Admin
exports.addTaxRule = async (req, res) => {
  try {
    const { name, country, state, city, postalCode, rate, priority } = req.body;
    
    let settings = await TaxSetting.findOne();
    if (!settings) {
      settings = new TaxSetting();
    }
    
    const newRule = {
      name,
      country,
      state,
      city,
      postalCode,
      rate,
      priority: priority || 0,
      isActive: true
    };
    
    settings.taxRules.push(newRule);
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'CREATE',
      'TaxRule',
      null,
      { rule: newRule },
      'SUCCESS',
      req
    );
    
    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Tax rule added successfully'
    });
    
  } catch (error) {
    console.error('Add tax rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update tax rule
// @route   PUT /api/tax/rules/:ruleId
// @access  Private/Admin
exports.updateTaxRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    
    const settings = await TaxSetting.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Tax settings not found'
      });
    }
    
    const ruleIndex = settings.taxRules.findIndex(r => r._id.toString() === ruleId);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tax rule not found'
      });
    }
    
    Object.assign(settings.taxRules[ruleIndex], updates);
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'UPDATE',
      'TaxRule',
      ruleId,
      { updates },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: settings.taxRules[ruleIndex],
      message: 'Tax rule updated successfully'
    });
    
  } catch (error) {
    console.error('Update tax rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete tax rule
// @route   DELETE /api/tax/rules/:ruleId
// @access  Private/Admin
exports.deleteTaxRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    
    const settings = await TaxSetting.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Tax settings not found'
      });
    }
    
    const ruleIndex = settings.taxRules.findIndex(r => r._id.toString() === ruleId);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tax rule not found'
      });
    }
    
    const deletedRule = settings.taxRules[ruleIndex];
    settings.taxRules.splice(ruleIndex, 1);
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'DELETE',
      'TaxRule',
      ruleId,
      { deletedRule },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Tax rule deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete tax rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Toggle tax rule status
// @route   PUT /api/tax/rules/:ruleId/toggle
// @access  Private/Admin
exports.toggleTaxRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    
    const settings = await TaxSetting.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Tax settings not found'
      });
    }
    
    const rule = settings.taxRules.id(ruleId);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Tax rule not found'
      });
    }
    
    rule.isActive = !rule.isActive;
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'UPDATE',
      'TaxRule',
      ruleId,
      { isActive: rule.isActive },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: rule,
      message: `Tax rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`
    });
    
  } catch (error) {
    console.error('Toggle tax rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Calculate tax
// @route   POST /api/tax/calculate
// @access  Public
exports.calculateTax = async (req, res) => {
  try {
    const { subtotal, shippingCost, country, state, city, postalCode, taxIncluded = false } = req.body;
    
    const settings = await TaxSetting.findOne();
    if (!settings) {
      // Return default tax calculation (10%)
      const tax = (subtotal + (shippingCost || 0)) * 0.1;
      return res.status(200).json({
        success: true,
        data: { tax, rate: 10, details: { type: 'default' } }
      });
    }
    
    let taxRate = settings.globalTaxRate;
    let taxDetails = { type: 'global', rate: taxRate };
    
    // Check for specific tax rules
    if (settings.taxRules.length > 0) {
      const applicableRules = settings.taxRules.filter(rule => {
        if (!rule.isActive) return false;
        
        let matches = true;
        if (rule.country && rule.country !== country) matches = false;
        if (rule.state && rule.state !== state) matches = false;
        if (rule.city && rule.city !== city) matches = false;
        if (rule.postalCode && rule.postalCode !== postalCode) matches = false;
        return matches;
      });
      
      if (applicableRules.length > 0) {
        // Sort by priority and get the highest priority
        applicableRules.sort((a, b) => b.priority - a.priority);
        taxRate = applicableRules[0].rate;
        taxDetails = { type: 'specific', rule: applicableRules[0].name, rate: taxRate };
      }
    }
    
    let taxableAmount = subtotal;
    if (settings.applyTaxToShipping) {
      taxableAmount += shippingCost || 0;
    }
    
    let tax = 0;
    if (!taxIncluded && !settings.taxIncludedInPrice) {
      tax = (taxableAmount * taxRate) / 100;
    }
    
    res.status(200).json({
      success: true,
      data: { tax, rate: taxRate, details: taxDetails, taxableAmount }
    });
    
  } catch (error) {
    console.error('Calculate tax error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};