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

// SIMPLIFIED Order access - Just check token and try both auth methods
router.get('/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const jwt = require('jsonwebtoken');
  
  try {
    // First try to verify as admin
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // If it's admin/manager, get user
    if (decoded.role === 'admin' || decoded.role === 'super-admin' || decoded.role === 'manager') {
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return getOrder(req, res);
      }
    }
    
    // Otherwise try as customer
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(decoded.id);
    if (customer) {
      req.customer = customer;
      return getOrder(req, res);
    }
    
    return res.status(401).json({ success: false, message: 'User not found' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// SIMPLIFIED Invoice download
router.get('/:id/invoice', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const jwt = require('jsonwebtoken');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // If it's admin/manager
    if (decoded.role === 'admin' || decoded.role === 'super-admin' || decoded.role === 'manager') {
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return generateInvoice(req, res);
      }
    }
    
    // Otherwise try as customer
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(decoded.id);
    if (customer) {
      req.customer = customer;
      return generateInvoice(req, res);
    }
    
    return res.status(401).json({ success: false, message: 'User not found' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Admin routes - protected
router.use(protect);
router.use(authorize('super-admin', 'admin', 'manager'));

router.get('/admin/all', getAllOrders);
router.get('/admin/stats', getOrderStats);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/return/process', processReturn);

module.exports = router;