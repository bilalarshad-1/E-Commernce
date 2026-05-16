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

const {
  uploadProductImage: uploadImage
} = require('../config/cloudinary');

const multer = require('multer');

const router = express.Router();

/* =========================================
   PUBLIC ROUTES
========================================= */

// Get all products
router.get('/', getProducts);

// Get single product
router.get('/:id', getProduct);

// Get product by barcode
router.get('/barcode/:barcode', getProductByBarcode);

// Get products by category
router.get('/by-category/:categoryId', getProductsByCategory);

/* =========================================
   PRODUCT MANAGEMENT
========================================= */

// Product statistics
router.get('/stats/summary', getProductStats);

// Bulk assign categories
router.post('/bulk/categories', bulkAssignCategories);

// Create product
router.post(
  '/',
  multer().fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  createProduct
);

// Update product
router.put(
  '/:id',
  multer().fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  updateProduct
);

// Delete product
router.delete('/:id', deleteProduct);

// Update stock
router.put('/:id/stock', updateStock);

/* =========================================
   PRODUCT IMAGES
========================================= */

// Upload product image
router.post(
  '/:id/images',
  uploadImage.single('image'),
  uploadProductImage
);

// Delete product image
router.delete('/:id/images/:imageId', deleteProductImage);

module.exports = router;