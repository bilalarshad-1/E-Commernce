const express = require('express');
const {
  getHeroSlides,
  getHeroSlide,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides
} = require('../controllers/heroController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadHeroImage } = require('../config/cloudinary');

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.get('/', getHeroSlides);
router.get('/:id', getHeroSlide);

// ============================================
// ADMIN ROUTES
// ============================================
router.post(
  '/',
  protect,
  authorize('super-admin', 'admin'),
  uploadHeroImage.single('bgImage'),
  createHeroSlide
);

router.put(
  '/:id',
  protect,
  authorize('super-admin', 'admin'),
  uploadHeroImage.single('bgImage'),
  updateHeroSlide
);

router.delete(
  '/:id',
  protect,
  authorize('super-admin', 'admin'),
  deleteHeroSlide
);

router.post(
  '/reorder',
  protect,
  authorize('super-admin', 'admin'),
  reorderHeroSlides
);

module.exports = router;