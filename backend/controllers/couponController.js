const Coupon = require('../models/Coupon');
const AuditLog = require('../models/AuditLog');
const moment = require('moment');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique coupon code
const generateCouponCode = (prefix = 'COUPON') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${timestamp}${random}`;
};

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

// ============================================
// PUBLIC ROUTES
// ============================================

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Public
exports.validateCoupon = async (req, res) => {
  try {
    const { code, subtotal, userId } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }
    
    const validation = await coupon.isValid(userId, subtotal);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    const discount = coupon.calculateDiscount(subtotal);
    
    res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
        freeShipping: coupon.freeShipping,
        minPurchase: coupon.minPurchase
      },
      message: validation.message
    });
    
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get available coupons for user
// @route   GET /api/coupons/available
// @access  Private
exports.getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user?._id;
    
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      usageLimit: { $gt: '$usedCount' }
    });
    
    // Filter coupons that are valid for the user
    const availableCoupons = [];
    for (const coupon of coupons) {
      const validation = await coupon.isValid(userId);
      if (validation.valid) {
        availableCoupons.push({
          _id: coupon._id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minPurchase: coupon.minPurchase,
          freeShipping: coupon.freeShipping,
          endDate: coupon.endDate
        });
      }
    }
    
    res.status(200).json({
      success: true,
      count: availableCoupons.length,
      data: availableCoupons
    });
    
  } catch (error) {
    console.error('Get available coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// ADMIN ROUTES
// ============================================

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minPurchase,
      usageLimit,
      perUserLimit,
      startDate,
      endDate,
      applicableProducts,
      applicableCategories,
      excludeProducts,
      eligibleCustomers,
      newCustomersOnly,
      freeShipping,
      firstOrderOnly,
      stackable
    } = req.body;
    
    // Check if coupon code already exists
    let couponCode = code;
    if (!couponCode) {
      couponCode = generateCouponCode();
    } else {
      const existingCoupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
    }
    
    const coupon = await Coupon.create({
      code: couponCode.toUpperCase(),
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmount: maxDiscountAmount || 0,
      minPurchase: minPurchase || 0,
      usageLimit: usageLimit || 1,
      perUserLimit: perUserLimit || 1,
      startDate: startDate || new Date(),
      endDate,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      excludeProducts: excludeProducts || [],
      eligibleCustomers: eligibleCustomers || [],
      newCustomersOnly: newCustomersOnly || false,
      freeShipping: freeShipping || false,
      firstOrderOnly: firstOrderOnly || false,
      stackable: stackable || false,
      createdBy: req.user._id,
      isActive: true
    });
    
    await createAuditLog(
      req.user._id,
      'CREATE',
      'Coupon',
      coupon._id,
      {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      'SUCCESS',
      req
    );
    
    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully'
    });
    
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
exports.getAllCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || '-createdAt';
    
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      filter.$or = [
        { code: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const coupons = await Coupon.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('eligibleCustomers', 'name email');
    
    const total = await Coupon.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single coupon
// @route   GET /api/coupons/:id
// @access  Private/Admin
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('eligibleCustomers', 'name email')
      .populate('applicableProducts', 'productName price')
      .populate('applicableCategories', 'name')
      .populate('excludeProducts', 'productName price');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: coupon
    });
    
  } catch (error) {
    console.error('Get coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    const oldData = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      isActive: coupon.isActive
    };
    
    const updates = req.body;
    
    // If code is being updated, check for duplicates
    if (updates.code && updates.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: updates.code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
      updates.code = updates.code.toUpperCase();
    }
    
    Object.assign(coupon, updates);
    await coupon.save();
    
    await createAuditLog(
      req.user._id,
      'UPDATE',
      'Coupon',
      coupon._id,
      {
        old: oldData,
        new: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          isActive: coupon.isActive
        }
      },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: coupon,
      message: 'Coupon updated successfully'
    });
    
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    await coupon.deleteOne();
    
    await createAuditLog(
      req.user._id,
      'DELETE',
      'Coupon',
      coupon._id,
      {
        code: coupon.code,
        name: coupon.name
      },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Toggle coupon status
// @route   PUT /api/coupons/:id/toggle-status
// @access  Private/Admin
exports.toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    await createAuditLog(
      req.user._id,
      'UPDATE',
      'Coupon',
      coupon._id,
      {
        action: 'toggle_status',
        isActive: coupon.isActive
      },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: coupon,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`
    });
    
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get coupon statistics
// @route   GET /api/coupons/stats/summary
// @access  Private/Admin
exports.getCouponStats = async (req, res) => {
  try {
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true });
    const expiredCoupons = await Coupon.countDocuments({ 
      endDate: { $lt: new Date() },
      isActive: true
    });
    
    const totalDiscountGiven = await Coupon.aggregate([
      { $unwind: '$usedBy' },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: '$usedBy.discountAmount' }
        }
      }
    ]);
    
    const mostUsedCoupons = await Coupon.find()
      .sort({ usedCount: -1 })
      .limit(5)
      .select('code name usedCount discountValue discountType');
    
    const usageByDay = await Coupon.aggregate([
      { $unwind: '$usedBy' },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$usedBy.usedAt' } },
          count: { $sum: 1 },
          totalDiscount: { $sum: '$usedBy.discountAmount' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalDiscountGiven: totalDiscountGiven[0]?.totalDiscount || 0,
        mostUsedCoupons,
        usageByDay
      }
    });
    
  } catch (error) {
    console.error('Get coupon stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};