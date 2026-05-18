const express = require('express');
const {
  getShippingSettings,
  updateShippingSettings,
  addShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  addShippingZone,
  updateShippingZone,
  deleteShippingZone,
  calculateShippingCost
} = require('../controllers/shippingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.get('/settings', getShippingSettings);
router.post('/calculate', calculateShippingCost);

// ============================================
// ADMIN ROUTES
// ============================================
router.put('/settings', protect, authorize('admin', 'super-admin'), updateShippingSettings);

// Shipping Methods
router.post('/methods', protect, authorize('admin', 'super-admin'), addShippingMethod);
router.put('/methods/:methodName', protect, authorize('admin', 'super-admin'), updateShippingMethod);
router.delete('/methods/:methodName', protect, authorize('admin', 'super-admin'), deleteShippingMethod);

// Shipping Zones
router.post('/zones', protect, authorize('admin', 'super-admin'), addShippingZone);
router.put('/zones/:zoneName', protect, authorize('admin', 'super-admin'), updateShippingZone);
router.delete('/zones/:zoneName', protect, authorize('admin', 'super-admin'), deleteShippingZone);

module.exports = router;