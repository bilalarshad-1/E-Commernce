// routes/productRoutes.js
const express = require('express');
const {
  // Main CRUD
  createProduct,
  getProducts,
  getProduct,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
  
  // Stock Management
  updateStock,
  
  // Image Management
  uploadProductImage,
  deleteProductImage,
  
  // Statistics
  getProductStats,
  
  // Bulk Operations
  bulkAssignCategories,
  
  // Category Related
  getProductsByCategory,
  
  // Barcode/QR Generation
  generateBarcodeImage,
  generateQRImage,
  downloadBarcode,
  downloadQR,
  
  // Barcode Regeneration
  regenerateBarcode
} = require('../controllers/productController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProductImages, uploadGallery } = require('../config/cloudinary');

const router = express.Router();

// =====================
// PUBLIC ROUTES (No authentication required for viewing barcode/QR)
// =====================
// IMPORTANT: These must come BEFORE the /:id routes to avoid conflicts

// Barcode image generation (on-the-fly)
router.get('/:id/barcode-image', generateBarcodeImage);
router.get('/:id/barcode-download', downloadBarcode);

// QR code image generation (on-the-fly)
router.get('/:id/qr-image', generateQRImage);
router.get('/:id/qr-download', downloadQR);

// Barcode lookup (for scanning)
router.get('/barcode/:barcode', getProductByBarcode);

// =====================
// PROTECTED ROUTES (All routes below require authentication)
// =====================
router.use(protect);

// =====================
// STATISTICS (Admin/Manager level)
// =====================
router.get(
  '/stats/summary',
  authorize('super-admin', 'admin', 'manager'),
  getProductStats
);

// =====================
// PRODUCTS BY CATEGORY
// =====================
router.get('/by-category/:categoryId', getProductsByCategory);

// =====================
// BULK CATEGORY ASSIGNMENT
// =====================
router.post(
  '/bulk/categories',
  authorize('super-admin', 'admin', 'manager'),
  bulkAssignCategories
);

// =====================
// REGENERATE BARCODE
// =====================
router.post(
  '/:id/regenerate-barcode',
  authorize('super-admin', 'admin', 'manager'),
  regenerateBarcode
);

// =====================
// MAIN CRUD ROUTES
// =====================
router.route('/')
  .get(getProducts)
  .post(
    authorize('super-admin', 'admin', 'manager'),
    uploadProductImages,
    createProduct
  );

router.route('/:id')
  .get(getProduct)
  .put(
    authorize('super-admin', 'admin', 'manager'),
    uploadProductImages,
    updateProduct
  )
  .delete(
    authorize('super-admin', 'admin'),
    deleteProduct
  );

// =====================
// STOCK MANAGEMENT
// =====================
router.put(
  '/:id/stock',
  authorize('super-admin', 'admin', 'manager'),
  updateStock
);

// =====================
// IMAGE MANAGEMENT
// =====================
router.post(
  '/:id/images',
  authorize('super-admin', 'admin', 'manager'),
  uploadGallery.single('image'),
  uploadProductImage
);

router.delete(
  '/:id/images/:imageId',
  authorize('super-admin', 'admin', 'manager'),
  deleteProductImage
);

module.exports = router;