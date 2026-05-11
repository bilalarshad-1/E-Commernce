const express = require('express');
const {
  createCategory,
  getCategories,
  getCategory,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getCategoryProducts
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadCategoryImage } = require('../config/cloudinary');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public (within auth) routes
router.get('/tree', getCategoryTree);
router.get('/slug/:slug', getCategoryBySlug);

// Main CRUD routes
router.route('/')
  .get(getCategories)
  .post(authorize('super-admin', 'admin', 'manager'), uploadCategoryImage.single('image'), createCategory);

router.route('/:id')
  .get(getCategory)
  .put(authorize('super-admin', 'admin', 'manager'), uploadCategoryImage.single('image'), updateCategory)
  .delete(authorize('super-admin', 'admin'), deleteCategory);

// Get products by category
router.get('/:id/products', getCategoryProducts);

module.exports = router;