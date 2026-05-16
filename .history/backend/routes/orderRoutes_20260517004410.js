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

const router = express.Router();

/* =========================================
   PUBLIC ROUTES
========================================= */

// Create order
router.post('/', createOrder);

// Get customer orders
router.get('/my-orders', getMyOrders);

// Cancel order
router.put('/:id/cancel', cancelOrder);

// Request return
router.post('/:id/return', requestReturn);

/* =========================================
   ORDER DETAILS
========================================= */

// Get single order
router.get('/:id', getOrder);

// Download invoice
router.get('/:id/invoice', generateInvoice);

/* =========================================
   ADMIN ROUTES
========================================= */

// Get all orders
router.get('/admin/all', getAllOrders);

// Get order statistics
router.get('/admin/stats', getOrderStats);

// Update order status
router.put('/:id/status', updateOrderStatus);

// Process return request
router.put('/:id/return/process', processReturn);

module.exports = router;