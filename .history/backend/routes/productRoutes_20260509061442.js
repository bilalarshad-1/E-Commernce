const express = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
  updateStock,
  uploadProductImage,
  deleteProductImage,
  getProductStats
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProductImage: uploadImage, uploadGallery } = require('../config/cloudinary');
const multer = require('multer');

const router = express.Router();

// Configure multer for multiple file uploads
const upload = multer();
const cpUpload = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]);

// All routes require authentication
router.use(protect);

// Statistics route
router.get('/stats/summary', authorize('super-admin', 'admin', 'manager'), getProductStats);

// Barcode lookup
router.get('/barcode/:barcode', getProductByBarcode);

// Main CRUD routes
router.route('/')
  .get(getProducts)
  .post(authorize('super-admin', 'admin', 'manager'), cpUpload, createProduct);

router.route('/:id')
  .get(getProduct)
  .put(authorize('super-admin', 'admin', 'manager'), cpUpload, updateProduct)
  .delete(authorize('super-admin', 'admin'), deleteProduct);

// Stock management
router.put('/:id/stock', authorize('super-admin', 'admin', 'manager'), updateStock);

// Image management
router.post('/:id/images', 
  authorize('super-admin', 'admin', 'manager'), 
  uploadImage.single('image'), 
  uploadProductImage
);

router.delete('/:id/images/:imageId', 
  authorize('super-admin', 'admin', 'manager'), 
  deleteProductImage
);

module.exports = router;