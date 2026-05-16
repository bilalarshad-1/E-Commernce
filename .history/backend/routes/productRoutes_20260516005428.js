// routes/productRoutes.js
const express = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductStats,
  generateBarcodeImage,
  generateQRImage,
  downloadBarcode,
  downloadQR,
  regenerateBarcode
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProductImages } = require('../config/cloudinary');

const router = express.Router();

// ============ PUBLIC ROUTES (No authentication required for barcode/QR viewing) ============
// Barcode image generation (on-the-fly)
router.get('/:id/barcode-image', generateBarcodeImage);
router.get('/:id/barcode-download', downloadBarcode);

// QR code image generation (on-the-fly)
router.get('/:id/qr-image', generateQRImage);
router.get('/:id/qr-download', downloadQR);

// Barcode lookup (for scanning)
router.get('/barcode/:barcode', getProductByBarcode);

// ============ PROTECTED ROUTES ============
router.use(protect);

// Statistics route
router.get('/stats/summary', authorize('admin', 'manager'), getProductStats);

// Regenerate barcode
router.post('/:id/regenerate-barcode', authorize('admin', 'manager'), regenerateBarcode);

// Main CRUD routes
router.route('/')
  .get(getProducts)
  .post(authorize('admin', 'manager'), uploadProductImages, createProduct);

router.route('/:id')
  .get(getProduct)
  .put(authorize('admin', 'manager'), uploadProductImages, updateProduct)
  .delete(authorize('admin'), deleteProduct);

// Stock management
router.put('/:id/stock', authorize('admin', 'manager'), updateStock);

module.exports = router;