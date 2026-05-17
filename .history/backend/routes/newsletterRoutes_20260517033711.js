const express = require('express');
const {
  subscribe,
  unsubscribe,
  getStats,
  sendNewsletter
} = require('../controllers/newsletterController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.get('/stats', protect, authorize('super-admin', 'admin'), getStats);
router.post('/send', protect, authorize('super-admin', 'admin'), sendNewsletter);

module.exports = router;