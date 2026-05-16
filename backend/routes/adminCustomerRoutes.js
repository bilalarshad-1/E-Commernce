const express = require('express');
const {
  getAllCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerAuditLogs,
  getCustomerStats
} = require('../controllers/adminCustomerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('super-admin', 'admin'));

router.get('/stats/summary', getCustomerStats);
router.get('/', getAllCustomers);
router.get('/:id', getCustomer);
router.get('/:id/audit-logs', getCustomerAuditLogs);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;