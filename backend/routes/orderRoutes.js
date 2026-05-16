const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  requestReturn,
  getAllOrders,
  updateOrderStatus,
  processReturn,
  getOrderStats,
  generateInvoice
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { protect: customerProtect } = require('../middleware/customerAuthMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.post('/', createOrder);

// Customer routes (authenticated)
router.get('/my-orders', customerProtect, getMyOrders);
router.put('/:id/cancel', customerProtect, cancelOrder);
router.post('/:id/return', customerProtect, requestReturn);

// Order access (both customer and admin)
router.get('/:id', async (req, res, next) => {
  // Check if authenticated as customer or admin
  if (req.headers.authorization) {
    // Try customer auth first
    try {
      await customerProtect(req, res, async () => {
        await getOrder(req, res);
      });
    } catch {
      // Then try admin auth
      try {
        await protect(req, res, async () => {
          await getOrder(req, res);
        });
      } catch {
        next();
      }
    }
  } else {
    next();
  }
});

router.get('/:id/invoice', async (req, res, next) => {
  if (req.headers.authorization) {
    try {
      await customerProtect(req, res, async () => {
        await generateInvoice(req, res);
      });
    } catch {
      try {
        await protect(req, res, async () => {
          await generateInvoice(req, res);
        });
      } catch {
        next();
      }
    }
  } else {
    next();
  }
});

// Admin routes
router.use(protect);
router.use(authorize('super-admin', 'admin', 'manager'));

router.get('/admin/all', getAllOrders);
router.get('/admin/stats', getOrderStats);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/return/process', processReturn);

module.exports = router;