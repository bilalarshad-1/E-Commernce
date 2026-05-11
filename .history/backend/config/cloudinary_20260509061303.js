const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage for product images
const productImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
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
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  }
});

const uploadProductImage = multer({ storage: productImageStorage });
const uploadGallery = multer({ storage: galleryStorage });
const uploadColorImage = multer({ storage: colorImageStorage });

module.exports = {
  cloudinary,
  uploadProductImage,
  uploadGallery,
  uploadColorImage
};