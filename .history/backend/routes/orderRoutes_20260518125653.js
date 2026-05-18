const express = require('express');
const {
  createOrder,
  validateCoupon,
  getShippingMethods,
  calculateShippingAndTax,
  getMyOrders,
  getGuestOrder,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  generateInvoice,
  updatePaymentStatus,
  processReturn,  // Make sure this is imported
  requestReturn    // Make sure this is imported
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

/* =========================================
   PUBLIC ROUTES (No authentication required)
========================================= */

// Create order (guest or registered)
router.post('/', createOrder);

// Validate coupon
router.post('/validate-coupon', validateCoupon);

// Get shipping methods
router.get('/shipping-methods', getShippingMethods);

// Calculate shipping and tax
router.post('/calculate', calculateShippingAndTax);

// Get guest order by email and order number
router.post('/guest-order', getGuestOrder);

/* =========================================
   CUSTOMER ROUTES (Authentication required)
========================================= */

// Get customer's orders
router.get('/my-orders', protect, getMyOrders);

// Cancel order
router.put('/:id/cancel', protect, cancelOrder);

// Request return (Customer)
router.post('/:id/return', protect, requestReturn);

/* =========================================
   ORDER DETAILS
========================================= */

// Get single order (customer or admin)
router.get('/:id', protect, getOrder);

// Download invoice
router.get('/:id/invoice', protect, generateInvoice);

/* =========================================
   ADMIN ROUTES
========================================= */

// Get all orders
router.get('/admin/all', protect, authorize('admin', 'super-admin'), getAllOrders);

// Get order statistics
router.get('/admin/stats', protect, authorize('admin', 'super-admin'), getOrderStats);

// Update order status
router.put('/:id/status', protect, authorize('admin', 'super-admin'), updateOrderStatus);

// Update payment status
router.put('/:id/payment', protect, authorize('admin', 'super-admin'), updatePaymentStatus);

// Process return request (Admin)
router.put('/:id/return/process', protect, authorize('admin', 'super-admin'), processReturn);

module.exports = router;