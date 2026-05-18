const express = require('express');
const {
  getAuditLogs,
  getUserAuditLogs,
  getAuditLogById,
  getAuditStats,
  exportAuditLogs,
  getProductAuditLogs,
  getProductImageAuditLogs,
  getProductAuditSummary
} = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All audit routes require authentication and admin/super-admin role
router.use(protect);
router.use(authorize('super-admin', 'admin'));

// ============================================
// PRODUCT AUDIT ROUTES
// ============================================
router.get('/products/summary', getProductAuditSummary);
router.get('/products/:productId', getProductAuditLogs);
router.get('/products/:productId/images', getProductImageAuditLogs);

// ============================================
// GENERAL AUDIT ROUTES
// ============================================
router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);
router.get('/export', exportAuditLogs);
router.get('/user/:userId', getUserAuditLogs);
router.get('/:id', getAuditLogById);

module.exports = router;