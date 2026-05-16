// routes/productRoutes.js
const express = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  getProductByBarcode,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  updateStock,
  uploadProductImage,
  deleteProductImage,
  getProductStats,
  bulkAssignCategories
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProductImages, uploadGallery } = require('../config/cloudinary');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Statistics route
router.get('/stats/summary', authorize('super-admin', 'admin', 'manager'), getProductStats);

// Barcode lookup
router.get('/barcode/:barcode', getProductByBarcode);

// Get products by category
router.get('/by-category/:categoryId', getProductsByCategory);

// Bulk category assignment
router.post('/bulk/categories', authorize('super-admin', 'admin', 'manager'), bulkAssignCategories);

// Main CRUD routes
router.route('/')
  .get(getProducts)
  .post(authorize('super-admin', 'admin', 'manager'), uploadProductImages, createProduct);

router.route('/:id')
  .get(getProduct)
  .put(authorize('super-admin', 'admin', 'manager'), uploadProductImages, updateProduct)
  .delete(authorize('super-admin', 'admin'), deleteProduct);

// Stock management
router.put('/:id/stock', authorize('super-admin', 'admin', 'manager'), updateStock);

// Image management
router.post('/:id/images', 
  authorize('super-admin', 'admin', 'manager'), 
  uploadGallery.single('image'), 
  uploadProductImage
);

router.delete('/:id/images/:imageId', 
  authorize('super-admin', 'admin', 'manager'), 
  deleteProductImage
);

module.exports = router;