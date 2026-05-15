// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage for product main images
const productImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/main',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Configure storage for product galleries
const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

// Configure storage for color images
const colorImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products/colors',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Configure storage for category images
const categoryImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Create multer instances
const uploadProductImage = multer({ 
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadGallery = multer({ 
  storage: galleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadColorImage = multer({ 
  storage: colorImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadCategoryImage = multer({ 
  storage: categoryImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Middleware for multiple file uploads
const uploadProductImages = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
  { name: 'colorImages', maxCount: 20 }
]);

module.exports = {
  cloudinary,
  uploadProductImage,
  uploadGallery,
  uploadColorImage,
  uploadCategoryImage,
  uploadProductImages
};