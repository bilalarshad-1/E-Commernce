// config/cloudinary.js - COMPLETE WITH ALL STORAGE CONFIGS
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ======================================================
// CLOUDINARY CONFIG
// ======================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ======================================================
// PRODUCT MAIN IMAGE STORAGE
// ======================================================
const productMainStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/main',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
  },
});

const uploadProductMain = multer({
  storage: productMainStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ======================================================
// PRODUCT GALLERY STORAGE
// ======================================================
const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const uploadGallery = multer({
  storage: galleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ======================================================
// MULTIPLE GALLERY UPLOAD
// ======================================================
const uploadMultipleGallery = multer({
  storage: galleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('gallery', 20);

// ======================================================
// COLOR IMAGE STORAGE
// ======================================================
const colorImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/colors',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const uploadColorImage = multer({
  storage: colorImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadMultipleColorImages = multer({
  storage: colorImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('images', 10);

// ======================================================
// CATEGORY IMAGE STORAGE
// ======================================================
const categoryImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const uploadCategoryImage = multer({
  storage: categoryImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ======================================================
// USER PROFILE IMAGE STORAGE
// ======================================================
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'users/profile',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ======================================================
// HERO IMAGE STORAGE
// ======================================================
const heroImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hero',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1920, height: 1080, crop: 'fill' }]
  }
});

const uploadHeroImage = multer({
  storage: heroImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ======================================================
// PRODUCT IMAGES (MAIN + GALLERY combined)
// ======================================================
const uploadProductImages = multer({
  storage: productMainStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 20 },
]);

// ======================================================
// SINGLE IMAGE UPLOAD (for product image endpoint)
// ======================================================
const uploadSingleImage = multer({
  storage: galleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  cloudinary,
  uploadProductMain,
  uploadGallery,
  uploadMultipleGallery,
  uploadColorImage,
  uploadMultipleColorImages,
  uploadCategoryImage,
  uploadProfileImage,
  uploadProductImages,
  uploadHeroImage,
  uploadSingleImage,
};