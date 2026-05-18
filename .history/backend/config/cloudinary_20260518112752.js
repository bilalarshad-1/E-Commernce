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
  cloudinary: cloudinary,
  params: {
    folder: 'products/main',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ======================================================
// PRODUCT GALLERY STORAGE
// ======================================================
const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const uploadGallery = multer({
  storage: galleryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ======================================================
// THUMBNAIL IMAGE STORAGE
// ======================================================
const thumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill', quality: 'auto' }],
  },
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ======================================================
// HOVER IMAGE STORAGE
// ======================================================
const hoverImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/hover',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
  },
});

const uploadHoverImage = multer({
  storage: hoverImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ======================================================
// COLOR IMAGE STORAGE
// ======================================================
const colorImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/colors',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto' }],
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
  cloudinary: cloudinary,
  params: {
    folder: 'categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
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
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
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
    transformation: [{ width: 1920, height: 1080, crop: 'fill', quality: 'auto' }],
  },
});

const uploadHeroImage = multer({
  storage: heroImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ======================================================
// MULTIPLE PRODUCT UPLOAD (MAIN + GALLERY + THUMBNAIL + HOVER)
// ======================================================
const uploadProductImages = multer({
  storage: productImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 20 },
  { name: 'thumbnailImage', maxCount: 1 },
  { name: 'hoverImage', maxCount: 1 },
]);

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  cloudinary,
  uploadProductImage,
  uploadGallery,
  uploadThumbnail,
  uploadHoverImage,
  uploadColorImage,
  uploadCategoryImage,
  uploadProfileImage,
  uploadProductImages,  
  uploadHeroImage,
};