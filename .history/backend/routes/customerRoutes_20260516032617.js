const express = require('express');
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  uploadProfileImage,
  addAddress,
  updateAddress,
  deleteAddress,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getStats,
  logout
} = require('../controllers/customerController');
const { protect } = require('../middleware/customerAuthMiddleware');
const { uploadProfileImage: upload } = require('../config/cloudinary');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many attempts, please try again later'
});

// Public routes
router.post('/register', register);
router.post('/login', authLimiter, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected routes
router.use(protect);
router.put('/change-password', changePassword);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/image', upload.single('image'), uploadProfileImage);
router.get('/logout', logout);
router.get('/stats', getStats);

// Address routes
router.route('/addresses')
  .post(addAddress);
router.route('/addresses/:addressId')
  .put(updateAddress)
  .delete(deleteAddress);

// Wishlist routes
router.route('/wishlist')
  .get(getWishlist);
router.route('/wishlist/:productId')
  .post(addToWishlist)
  .delete(removeFromWishlist);

module.exports = router;