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

// =====================
// AUTH MIDDLEWARE
// =====================
router.use(protect);

// =====================
// STATS (ADMIN LEVEL)
// =====================
router.get(
  '/stats/summary',
  authorize('super-admin', 'admin', 'manager'),
  getProductStats
);

// =====================
// BARCODE LOOKUP
// =====================
router.get('/barcode/:barcode', getProductByBarcode);

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
// CRUD ROUTES
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