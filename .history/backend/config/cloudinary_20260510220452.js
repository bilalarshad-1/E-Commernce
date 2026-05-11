const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Single storage configuration for ALL images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // ALL images go to the same 'uploads' folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Create multer instances - all using the same storage
const upload = multer({ storage: imageStorage });

// Export with different names for backward compatibility
module.exports = {
  cloudinary,
  uploadProductImage: upload,
  uploadGallery: upload,
  uploadColorImage: upload,
  uploadCategoryImage: upload
};