// routes/categoryRoutes.js
const express = require('express');
const {
  getCategories,
  getCategory,
  getCategoryBySlug,
  getCategoryTree,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadCategoryImage } = require('../config/cloudinary');

const router = express.Router();

// PUBLIC ROUTES (No auth)
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);
router.get('/:id/products', getCategoryProducts);

// ADMIN ROUTES (With auth) - These must come AFTER public routes
router.post(
  '/',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  uploadCategoryImage.single('image'),
  createCategory
);

router.put(
  '/:id',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  uploadCategoryImage.single('image'),
  updateCategory
);

router.delete(
  '/:id',
  protect,
  authorize('super-admin', 'admin'),
  deleteCategory
);

module.exports = router;