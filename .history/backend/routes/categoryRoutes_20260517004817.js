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

const { uploadCategoryImage } = require('../config/cloudinary');

const router = express.Router();

/* =========================================
   PUBLIC ROUTES
========================================= */

// Get category tree
router.get('/tree', getCategoryTree);

// Get category by slug
router.get('/slug/:slug', getCategoryBySlug);

// Get all categories
router.get('/', getCategories);

// Get single category
router.get('/:id', getCategory);

// Get products under category
router.get('/:id/products', getCategoryProducts);

/* =========================================
   CATEGORY MANAGEMENT
========================================= */

// Create category
router.post(
  '/',
  uploadCategoryImage.single('image'),
  createCategory
);

// Update category
router.put(
  '/:id',
  uploadCategoryImage.single('image'),
  updateCategory
);

// Delete category
router.delete('/:id', deleteCategory);

module.exports = router;