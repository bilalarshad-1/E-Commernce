const express = require('express');
const {
  registerFirstUser,
  registerUser,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/register-first', registerFirstUser);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

// Protected routes
router.use(protect);
router.post('/register', authorize('super-admin', 'admin'), registerUser);
router.put('/change-password', changePassword);
router.get('/logout', logout);
router.get('/me', getMe);

module.exports = router;