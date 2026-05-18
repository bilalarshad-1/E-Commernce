const express = require('express');
const {
  validateCoupon,
  getAvailableCoupons,
  createCoupon,
  getAllCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponStats
} = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/validate', validateCoupon);

// ============================================
// CUSTOMER ROUTES
// ============================================
router.get('/available', protect, getAvailableCoupons);

// ============================================
// ADMIN ROUTES
// ============================================
router.get('/admin/stats', protect, authorize('admin', 'super-admin'), getCouponStats);
router.get('/admin/all', protect, authorize('admin', 'super-admin'), getAllCoupons);
router.post('/', protect, authorize('admin', 'super-admin'), createCoupon);
router.get('/:id', protect, authorize('admin', 'super-admin'), getCoupon);
router.put('/:id', protect, authorize('admin', 'super-admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin', 'super-admin'), deleteCoupon);
router.put('/:id/toggle-status', protect, authorize('admin', 'super-admin'), toggleCouponStatus);

module.exports = router;