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
const productImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'products/main',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});


// ======================================================
// PRODUCT GALLERY STORAGE
// ======================================================
const galleryStorage = new CloudinaryStorage({
  cloudinary,
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
// COLOR IMAGE STORAGE
// ======================================================
const colorImageStorage = new CloudinaryStorage({
  cloudinary,
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


// ======================================================
// CATEGORY IMAGE STORAGE
// ======================================================
const categoryImageStorage = new CloudinaryStorage({
  cloudinary,
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
// USER PROFILE IMAGE STORAGE (FIX YOU NEEDED)
// ======================================================
const profileImageStorage = new CloudinaryStorage({
  cloudinary,
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
// MULTIPLE PRODUCT UPLOAD (MAIN + GALLERY + COLORS)
// ======================================================
const uploadProductImages = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
  { name: 'colorImages', maxCount: 20 },
]);


// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  cloudinary,

  uploadProductImage,
  uploadGallery,
  uploadColorImage,
  uploadCategoryImage,
  uploadProfileImage, // ✅ IMPORTANT FIX

  uploadProductImages,
};