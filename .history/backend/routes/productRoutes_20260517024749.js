// routes/productRoutes.js - FIXED VERSION
const express = require('express');
const {
  getProducts,
  getProduct,
  getProductByBarcode,
  getProductsByCategory,
  createProduct,
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
const { uploadProductImages } = require('../config/cloudinary');

const router = express.Router();

// PUBLIC ROUTES
router.get('/', getProducts);
router.get('/stats/summary', getProductStats);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/by-category/:categoryId', getProductsByCategory);
router.get('/:id', getProduct);

// ADMIN ROUTES - Use Cloudinary storage
router.post(
  '/', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  uploadProductImages,  // Use Cloudinary multer configuration
  createProduct
);

router.put(
  '/:id', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  uploadProductImages,
  updateProduct
);

router.delete('/:id', protect, authorize('super-admin', 'admin'), deleteProduct);
router.put('/:id/stock', protect, authorize('super-admin', 'admin', 'manager'), updateStock);

// Single image upload for gallery
router.post(
  '/:id/images', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  require('../config/cloudinary').uploadProductImage.single('image'), 
  uploadProductImage
);

router.delete('/:id/images/:imageId', protect, authorize('super-admin', 'admin', 'manager'), deleteProductImage);
router.post('/bulk/categories', protect, authorize('super-admin', 'admin', 'manager'), bulkAssignCategories);

module.exports = router;