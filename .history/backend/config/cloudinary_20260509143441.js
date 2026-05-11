// Add to existing configurations
const categoryImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

const uploadCategoryImage = multer({ storage: categoryImageStorage });

module.exports = {
  cloudinary,
  uploadProductImage,
  uploadGallery,
  uploadColorImage,
  uploadCategoryImage  // Add this
};