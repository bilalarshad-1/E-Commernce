const express = require('express');
const {
  getProducts,
  getProduct,
  getProductBySlug,
  getProductsByCategory,
  getFeaturedProducts,
  getHotSaleProducts,
  getTopRatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateRating,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages,
  setMainGalleryImage,
  updateMainImage,
  deleteMainImage,
  uploadColorImages,
  deleteColorImage,
  setMainColorImage,
  getProductStats,
  bulkAssignCategories,
  bulkUpdateFlags,
  updateProductSEO
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { 
  uploadProductImages, 
  uploadGallery, 
  uploadColorImage,
  uploadProductImage
} = require('../config/cloudinary');

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
router.get('/', getProducts);
router.get('/stats/summary', getProductStats);
router.get('/featured', getFeaturedProducts);
router.get('/hot-sale', getHotSaleProducts);
router.get('/top-rated', getTopRatedProducts);
router.get('/by-category/:categoryId', getProductsByCategory);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProduct);

// ============================================
// ADMIN ROUTES (Authentication required)
// ============================================

// Product CRUD
router.post(
  '/', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  uploadProductImages,
  createProduct
);

router.put(
  '/:id', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  uploadProductImages,
  updateProduct
);

router.delete(
  '/:id', 
  protect, 
  authorize('super-admin', 'admin'), 
  deleteProduct
);

// Rating management
router.put(
  '/:id/rating', 
  protect, 
  authorize('super-admin', 'admin'), 
  updateRating
);

// Main Image management
router.put(
  '/:id/main-image',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  uploadProductImage.single('image'),
  updateMainImage
);

router.delete(
  '/:id/main-image',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  deleteMainImage
);

// Gallery Image management
router.post(
  '/:id/gallery',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  uploadGallery.single('image'),
  uploadGalleryImage
);

router.put(
  '/:id/gallery/:imageId',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  updateGalleryImage
);

router.delete(
  '/:id/gallery/:imageId',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  deleteGalleryImage
);

router.put(
  '/:id/gallery/reorder',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  reorderGalleryImages
);

router.put(
  '/:id/gallery/:imageId/main',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  setMainGalleryImage
);

// Color Image management
router.post(
  '/:id/colors/:colorId/images',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  uploadColorImage.array('images', 10),
  uploadColorImages
);

router.delete(
  '/:id/colors/:colorId/images/:imageId',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  deleteColorImage
);

router.put(
  '/:id/colors/:colorId/images/:imageId/main',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  setMainColorImage
);

// SEO management
router.put(
  '/:id/seo',
  protect,
  authorize('super-admin', 'admin', 'manager'),
  updateProductSEO
);

// Bulk operations
router.post(
  '/bulk/categories', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  bulkAssignCategories
);

router.put(
  '/bulk/flags', 
  protect, 
  authorize('super-admin', 'admin', 'manager'), 
  bulkUpdateFlags
);

module.exports = router;