// routes/productRoutes.js
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
const { uploadProductImage: uploadImage } = require('../config/cloudinary');
const multer = require('multer');

const router = express.Router();

// PUBLIC ROUTES
router.get('/', getProducts);
router.get('/stats/summary', getProductStats);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/by-category/:categoryId', getProductsByCategory);
router.get('/:id', getProduct);

// ADMIN ROUTES
const cpUpload = multer().fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]);

router.post('/', protect, authorize('super-admin', 'admin', 'manager'), cpUpload, createProduct);
router.put('/:id', protect, authorize('super-admin', 'admin', 'manager'), cpUpload, updateProduct);
router.delete('/:id', protect, authorize('super-admin', 'admin'), deleteProduct);
router.put('/:id/stock', protect, authorize('super-admin', 'admin', 'manager'), updateStock);
router.post('/:id/images', protect, authorize('super-admin', 'admin', 'manager'), uploadImage.single('image'), uploadProductImage);
router.delete('/:id/images/:imageId', protect, authorize('super-admin', 'admin', 'manager'), deleteProductImage);
router.post('/bulk/categories', protect, authorize('super-admin', 'admin', 'manager'), bulkAssignCategories);

module.exports = router;