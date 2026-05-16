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

// Simple token verification helper
const verifyToken = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Public routes
router.post('/', createOrder);

// Customer routes (authenticated)
router.get('/my-orders', customerProtect, getMyOrders);
router.put('/:id/cancel', customerProtect, cancelOrder);
router.post('/:id/return', customerProtect, requestReturn);

// Simple order access - check token and set user/customer
router.get('/:id', async (req, res) => {
  const decoded = verifyToken(req);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // If it's admin/manager role, set as user
  if (decoded.role === 'admin' || decoded.role === 'super-admin' || decoded.role === 'manager') {
    try {
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return getOrder(req, res);
      }
    } catch (err) {
      console.error('Admin auth error:', err);
    }
  }
  
  // Otherwise try as customer
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(decoded.id);
    if (customer) {
      req.customer = customer;
      return getOrder(req, res);
    }
  } catch (err) {
    console.error('Customer auth error:', err);
  }
  
  return res.status(401).json({
    success: false,
    message: 'Invalid authentication'
  });
});

// Simple invoice download - check token and set user/customer
router.get('/:id/invoice', async (req, res) => {
  const decoded = verifyToken(req);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // If it's admin/manager role, set as user
  if (decoded.role === 'admin' || decoded.role === 'super-admin' || decoded.role === 'manager') {
    try {
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return generateInvoice(req, res);
      }
    } catch (err) {
      console.error('Admin auth error:', err);
    }
  }
  
  // Otherwise try as customer
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(decoded.id);
    if (customer) {
      req.customer = customer;
      return generateInvoice(req, res);
    }
  } catch (err) {
    console.error('Customer auth error:', err);
  }
  
  return res.status(401).json({
    success: false,
    message: 'Invalid authentication'
  });
});

// Admin routes
router.use(protect);
router.use(authorize('super-admin', 'admin', 'manager'));

router.get('/admin/all', getAllOrders);
router.get('/admin/stats', getOrderStats);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/return/process', processReturn);

module.exports = router;