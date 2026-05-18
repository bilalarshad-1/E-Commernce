const express = require('express');
const {
  getTaxSettings,
  updateTaxSettings,
  addTaxRule,
  updateTaxRule,
  deleteTaxRule,
  toggleTaxRule,
  calculateTax
} = require('../controllers/taxController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.get('/settings', getTaxSettings);
router.post('/calculate', calculateTax);

// ============================================
// ADMIN ROUTES
// ============================================
router.put('/settings', protect, authorize('admin', 'super-admin'), updateTaxSettings);

// Tax Rules
router.post('/rules', protect, authorize('admin', 'super-admin'), addTaxRule);
router.put('/rules/:ruleId', protect, authorize('admin', 'super-admin'), updateTaxRule);
router.delete('/rules/:ruleId', protect, authorize('admin', 'super-admin'), deleteTaxRule);
router.put('/rules/:ruleId/toggle', protect, authorize('admin', 'super-admin'), toggleTaxRule);

module.exports = router;