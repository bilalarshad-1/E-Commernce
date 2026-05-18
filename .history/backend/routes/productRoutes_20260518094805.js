// routes/productRoutes.js
const express = require('express');
const {
  getProducts,
  getProduct,
  getProductByBarcode,
  getProductsByCategory,
  getFeaturedProducts,
  getHotSaleProducts,
  getTopRatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  updateRating,
  uploadProductImage,
  deleteProductImage,
  getProductStats,
  bulkAssignCategories,
  bulkUpdateFlags
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProductImages } = require('../config/cloudinary');

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
router.get('/', getProducts);
router.get('/stats/summary', getProductStats);
router.get('/featured', getFeaturedProducts);
router.get('/hot-sale', getHotSaleProducts);
router.get('/top-rated', getTopRatedProducts);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/by-category/:categoryId', getProductsByCategory);
router.get('/:id', getProduct);

// ============================================
// ADMIN ROUTES (Authentication required)
// ============================================

// Product CRUD
router.post(
  '/', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  uploadProductImages,
  createProduct
);

router.put(
  '/:id', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  uploadProductImages,
  updateProduct
);

router.delete(
  '/:id', 
  protect, 
  authorize('super-admin', 'admin'), 
  deleteProduct
);

// Stock management
router.put(
  '/:id/stock', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  updateStock
);

// Rating management
router.put(
  '/:id/rating', 
  protect, 
  authorize('super-admin', 'admin'), 
  updateRating
);

// Image management
router.post(
  '/:id/images', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  require('../config/cloudinary').uploadProductImage.single('image'), 
  uploadProductImage
);

router.delete(
  '/:id/images/:imageId', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  deleteProductImage
);

// Bulk operations
router.post(
  '/bulk/categories', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  bulkAssignCategories
);

router.put(
  '/bulk/flags', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  bulkUpdateFlags
);
