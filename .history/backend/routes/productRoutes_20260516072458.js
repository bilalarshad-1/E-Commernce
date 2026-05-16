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

const {
  uploadProductImage: uploadImage
} = require('../config/cloudinary');

const multer = require('multer');

const router = express.Router();

/* =========================
   PUBLIC ROUTES (NO AUTH)
   ========================= */

// Products listing (home/shop)
router.get('/', getProducts);

// Single product
router.get('/:id', getProduct);

// Barcode lookup
router.get('/barcode/:barcode', getProductByBarcode);

// Products by category
router.get('/by-category/:categoryId', getProductsByCategory);


/* =========================
   AUTH MIDDLEWARE BELOW
   ========================= */

router.use(protect);


/* =========================
   PROTECTED ROUTES
   ========================= */

// Stats
router.get(
  '/stats/summary',
  authorize('super-admin', 'admin', 'manager'),
  getProductStats
);

// Bulk category assignment
router.post(
  '/bulk/categories',
  authorize('super-admin', 'admin', 'manager'),
  bulkAssignCategories
);

// Create product
router.post(
  '/',
  authorize('super-admin', 'admin', 'manager'),
  multer().fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  createProduct
);

// Update product
router.put(
  '/:id',
  authorize('super-admin', 'admin', 'manager'),
  multer().fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  updateProduct
);

// Delete product
router.delete(
  '/:id',
  authorize('super-admin', 'admin'),
  deleteProduct
);

// Stock update
router.put(
  '/:id/stock',
  authorize('super-admin', 'admin', 'manager'),
  updateStock
);

// Add image
router.post(
  '/:id/images',
  authorize('super-admin', 'admin', 'manager'),
  uploadImage.single('image'),
  uploadProductImage
);

// Delete image
router.delete(
  '/:id/images/:imageId',
  authorize('super-admin', 'admin', 'manager'),
  deleteProductImage
);

module.exports = router;