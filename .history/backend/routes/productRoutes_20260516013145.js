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


// ======================================================
// PUBLIC ROUTES
// ======================================================

// Barcode image generation
router.get('/:id/barcode-image', generateBarcodeImage);
router.get('/:id/barcode-download', downloadBarcode);

// QR image generation
router.get('/:id/qr-image', generateQRImage);
router.get('/:id/qr-download', downloadQR);

// Barcode scanner lookup
router.get('/barcode/:barcode', getProductByBarcode);


// ======================================================
// PROTECTED ROUTES
// ======================================================

router.use(protect);


// ======================================================
// PRODUCT STATS
// ======================================================

router.get(
  '/stats/summary',
  authorize('super-admin', 'admin', 'manager'),
  getProductStats
);


// ======================================================
// BARCODE MANAGEMENT
// ======================================================

router.post(
  '/:id/regenerate-barcode',
  authorize('super-admin', 'admin', 'manager'),
  regenerateBarcode
);


// ======================================================
// MAIN CRUD ROUTES
// ======================================================

router.route('/')

  // GET ALL PRODUCTS
  .get(getProducts)

  // CREATE PRODUCT
  .post(
    authorize('super-admin', 'admin', 'manager'),
    uploadProductImages,
    createProduct
  );

router.route('/:id')

  // GET SINGLE PRODUCT
  .get(getProduct)

  // UPDATE PRODUCT
  .put(
    authorize('super-admin', 'admin', 'manager'),
    uploadProductImages,
    updateProduct
  )

  // DELETE PRODUCT
  .delete(
    authorize('super-admin', 'admin'),
    deleteProduct
  );


// ======================================================
// STOCK MANAGEMENT
// ======================================================

router.put(
  '/:id/stock',
  authorize('super-admin', 'admin', 'manager'),
  updateStock
);

module.exports = router;