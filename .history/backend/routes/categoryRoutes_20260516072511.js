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


/* =========================
   PUBLIC ROUTES (NO AUTH)
   ========================= */

// Category tree (for navbar)
router.get('/tree', getCategoryTree);

// Category by slug (SEO pages)
router.get('/slug/:slug', getCategoryBySlug);

// Categories list
router.get('/', getCategories);

// Single category
router.get('/:id', getCategory);

// Products under category
router.get('/:id/products', getCategoryProducts);


/* =========================
   AUTH MIDDLEWARE BELOW
   ========================= */

router.use(protect);


/* =========================
   PROTECTED ROUTES
   ========================= */

// Create category
router.post(
  '/',
  authorize('super-admin', 'admin', 'manager'),
  uploadCategoryImage.single('image'),
  createCategory
);

// Update category
router.put(
  '/:id',
  authorize('super-admin', 'admin', 'manager'),
  uploadCategoryImage.single('image'),
  updateCategory
);

// Delete category
router.delete(
  '/:id',
  authorize('super-admin', 'admin'),
  deleteCategory
);

module.exports = router;