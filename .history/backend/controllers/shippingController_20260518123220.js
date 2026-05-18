const ShippingSetting = require('../models/ShippingSetting');
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

// @desc    Get shipping settings
// @route   GET /api/shipping/settings
// @access  Public
exports.getShippingSettings = async (req, res) => {
  try {
    let settings = await ShippingSetting.findOne();
    
    if (!settings) {
      // Return default settings
      settings = {
        methods: [
          { name: 'standard', displayName: 'Standard Shipping', cost: 10, minDays: 3, maxDays: 7, isActive: true, freeShippingThreshold: 100 },
          { name: 'express', displayName: 'Express Shipping', cost: 25, minDays: 1, maxDays: 3, isActive: true, freeShippingThreshold: 0 },
          { name: 'overnight', displayName: 'Overnight Shipping', cost: 50, minDays: 1, maxDays: 1, isActive: true, freeShippingThreshold: 0 }
        ],
        shippingZones: [],
        defaultShippingMethod: 'standard'
      };
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    console.error('Get shipping settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update shipping settings
// @route   PUT /api/shipping/settings
// @access  Private/Admin
exports.updateShippingSettings = async (req, res) => {
  try {
    const { methods, shippingZones, defaultShippingMethod } = req.body;
    
    let settings = await ShippingSetting.findOne();
    
    if (!settings) {
      settings = new ShippingSetting();
    }
    
    if (methods) settings.methods = methods;
    if (shippingZones) settings.shippingZones = shippingZones;
    if (defaultShippingMethod) settings.defaultShippingMethod = defaultShippingMethod;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'UPDATE',
      'ShippingSetting',
      settings._id,
      {
        methodsCount: methods?.length,
        shippingZonesCount: shippingZones?.length,
        defaultShippingMethod
      },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Shipping settings updated successfully'
    });
    
  } catch (error) {
    console.error('Update shipping settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Add shipping method
// @route   POST /api/shipping/methods
// @access  Private/Admin
exports.addShippingMethod = async (req, res) => {
  try {
    const { name, displayName, description, cost, minDays, maxDays, freeShippingThreshold } = req.body;
    
    let settings = await ShippingSetting.findOne();
    if (!settings) {
      settings = new ShippingSetting();
    }
    
    const newMethod = {
      name,
      displayName,
      description,
      cost,
      minDays,
      maxDays,
      isActive: true,
      freeShippingThreshold: freeShippingThreshold || 0
    };
    
    settings.methods.push(newMethod);
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'CREATE',
      'ShippingMethod',
      null,
      { method: newMethod },
      'SUCCESS',
      req
    );
    
    res.status(201).json({
      success: true,
      data: newMethod,
      message: 'Shipping method added successfully'
    });
    
  } catch (error) {
    console.error('Add shipping method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update shipping method
// @route   PUT /api/shipping/methods/:methodName
// @access  Private/Admin
exports.updateShippingMethod = async (req, res) => {
  try {
    const { methodName } = req.params;
    const updates = req.body;
    
    const settings = await ShippingSetting.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Shipping settings not found'
      });
    }
    
    const methodIndex = settings.methods.findIndex(m => m.name === methodName);
    if (methodIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Shipping method not found'
      });
    }
    
    Object.assign(settings.methods[methodIndex], updates);
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'UPDATE',
      'ShippingMethod',
      null,
      { methodName, updates },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: settings.methods[methodIndex],
      message: 'Shipping method updated successfully'
    });
    
  } catch (error) {
    console.error('Update shipping method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete shipping method
// @route   DELETE /api/shipping/methods/:methodName
// @access  Private/Admin
exports.deleteShippingMethod = async (req, res) => {
  try {
    const { methodName } = req.params;
    
    const settings = await ShippingSetting.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Shipping settings not found'
      });
    }
    
    const methodIndex = settings.methods.findIndex(m => m.name === methodName);
    if (methodIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Shipping method not found'
      });
    }
    
    const deletedMethod = settings.methods[methodIndex];
    settings.methods.splice(methodIndex, 1);
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'DELETE',
      'ShippingMethod',
      null,
      { deletedMethod },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Shipping method deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete shipping method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Add shipping zone
// @route   POST /api/shipping/zones
// @access  Private/Admin
exports.addShippingZone = async (req, res) => {
  try {
    const { name, countries, cost, freeShippingThreshold } = req.body;
    
    let settings = await ShippingSetting.findOne();
    if (!settings) {
      settings = new ShippingSetting();
    }
    
    const newZone = {
      name,
      countries,
      cost,
      freeShippingThreshold: freeShippingThreshold || 0
    };
    
    settings.shippingZones.push(newZone);
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'CREATE',
      'ShippingZone',
      null,
      { zone: newZone },
      'SUCCESS',
      req
    );
    
    res.status(201).json({
      success: true,
      data: newZone,
      message: 'Shipping zone added successfully'
    });
    
  } catch (error) {
    console.error('Add shipping zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update shipping zone
// @route   PUT /api/shipping/zones/:zoneName
// @access  Private/Admin
exports.updateShippingZone = async (req, res) => {
  try {
    const { zoneName } = req.params;
    const updates = req.body;
    
    const settings = await ShippingSetting.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Shipping settings not found'
      });
    }
    
    const zoneIndex = settings.shippingZones.findIndex(z => z.name === zoneName);
    if (zoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Shipping zone not found'
      });
    }
    
    Object.assign(settings.shippingZones[zoneIndex], updates);
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'UPDATE',
      'ShippingZone',
      null,
      { zoneName, updates },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: settings.shippingZones[zoneIndex],
      message: 'Shipping zone updated successfully'
    });
    
  } catch (error) {
    console.error('Update shipping zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete shipping zone
// @route   DELETE /api/shipping/zones/:zoneName
// @access  Private/Admin
exports.deleteShippingZone = async (req, res) => {
  try {
    const { zoneName } = req.params;
    
    const settings = await ShippingSetting.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Shipping settings not found'
      });
    }
    
    const zoneIndex = settings.shippingZones.findIndex(z => z.name === zoneName);
    if (zoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Shipping zone not found'
      });
    }
    
    const deletedZone = settings.shippingZones[zoneIndex];
    settings.shippingZones.splice(zoneIndex, 1);
    await settings.save();
    
    await createAuditLog(
      req.user._id,
      'DELETE',
      'ShippingZone',
      null,
      { deletedZone },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Shipping zone deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete shipping zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Calculate shipping cost
// @route   POST /api/shipping/calculate
// @access  Public
exports.calculateShippingCost = async (req, res) => {
  try {
    const { subtotal, shippingMethod, country } = req.body;
    
    const settings = await ShippingSetting.findOne();
    if (!settings) {
      // Return default calculation
      const cost = subtotal > 100 ? 0 : 10;
      return res.status(200).json({
        success: true,
        data: { cost, method: 'standard', displayName: 'Standard Shipping' }
      });
    }
    
    let selectedMethod = settings.methods.find(m => m.name === (shippingMethod || settings.defaultShippingMethod));
    
    if (!selectedMethod) {
      selectedMethod = settings.methods.find(m => m.name === 'standard');
    }
    
    // Check for free shipping threshold
    if (selectedMethod.freeShippingThreshold > 0 && subtotal >= selectedMethod.freeShippingThreshold) {
      return res.status(200).json({
        success: true,
        data: { cost: 0, method: selectedMethod.name, displayName: selectedMethod.displayName }
      });
    }
    
    // Check shipping zones
    if (country && settings.shippingZones.length > 0) {
      const zone = settings.shippingZones.find(z => z.countries.includes(country));
      if (zone) {
        if (zone.freeShippingThreshold > 0 && subtotal >= zone.freeShippingThreshold) {
          return res.status(200).json({
            success: true,
            data: { cost: 0, method: selectedMethod.name, displayName: selectedMethod.displayName }
          });
        }
        return res.status(200).json({
          success: true,
          data: { cost: zone.cost, method: selectedMethod.name, displayName: selectedMethod.displayName }
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        cost: selectedMethod.cost,
        method: selectedMethod.name,
        displayName: selectedMethod.displayName,
        minDays: selectedMethod.minDays,
        maxDays: selectedMethod.maxDays
      }
    });
    
  } catch (error) {
    console.error('Calculate shipping cost error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};