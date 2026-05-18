const Product = require('../models/Product');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { cloudinary } = require('../config/cloudinary');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper function to validate and process categories
const processCategories = async (categoryIds, primaryCategoryId = null) => {
  let processedCategories = [];
  let categoryNames = [];
  let primaryCategory = null;
  
  if (categoryIds && categoryIds.length > 0) {
    const categories = await Category.find({ 
      _id: { $in: categoryIds },
      status: 'active'
    });
    
    categoryNames = categories.map(cat => cat.name.toLowerCase());
    processedCategories = categories.map(cat => cat._id);
    
    if (primaryCategoryId) {
      const primaryCat = categories.find(cat => cat._id.toString() === primaryCategoryId);
      if (primaryCat) {
        primaryCategory = primaryCat._id;
      }
    }
  }
  
  return { categories: processedCategories, categoryNames, primaryCategory };
};

// Create audit log
const createAuditLog = async (userId, action, entity, entityId, details = {}, status = 'SUCCESS', req = null) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entity,
      entityId,
      details,
      status,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent']
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// Helper to extract image metadata from Cloudinary result
const extractImageMetadata = (result, alt = '', caption = '') => ({
  url: result.secure_url,
  publicId: result.public_id,
  alt,
  caption,
  width: result.width,
  height: result.height,
  format: result.format,
  size: result.bytes
});

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sort = req.query.sort || '-createdAt';
    
    // Build filter object
    const filter = {
      status: 'active',
      isPublished: true
    };
    
    // Price filters
    if (req.query.minPrice) {
      filter.price = { ...filter.price, $gte: parseFloat(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) };
    }
    
    // Featured filter
    if (req.query.isFeatured === 'true') {
      filter.isFeatured = true;
    }
    
    // Hot sale filter
    if (req.query.isHotSale === 'true') {
      filter.isHotSale = true;
    }
    
    // Top rated filter
    if (req.query.isTopRated === 'true') {
      filter.isTopRated = true;
    }
    
    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { productName: { $regex: req.query.search, $options: 'i' } },
        { shortDescription: { $regex: req.query.search, $options: 'i' } },
        { longDescription: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Category filtering
    if (req.query.category) {
      filter.categoryNames = { $regex: new RegExp(req.query.category, 'i') };
    }
    
    // Tag filtering
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }
    
    const skip = (page - 1) * limit;
    
    let sortOption = {};
    if (sort === '-createdAt') sortOption = { createdAt: -1 };
    else if (sort === '-price') sortOption = { price: -1 };
    else if (sort === 'price') sortOption = { price: 1 };
    else if (sort === '-sales') sortOption = { sales: -1 };
    else if (sort === '-rating') sortOption = { rating: -1 };
    else sortOption = { createdAt: -1 };
    
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('categories', 'name slug')
      .populate('primaryCategory', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    const total = await Product.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categories', 'name slug description')
      .populate('primaryCategory', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Increment view count
    product.views += 1;
    await product.save();
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isPublished: true })
      .populate('categories', 'name slug description')
      .populate('primaryCategory', 'name slug');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.views += 1;
    await product.save();
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/by-category/:categoryId
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { includeSubcategories = 'true', page = 1, limit = 20 } = req.query;
    
    let categoryIds = [categoryId];
    
    if (includeSubcategories === 'true') {
      const getSubcategoryIds = async (parentId) => {
        const subcategories = await Category.find({ parentCategory: parentId });
        let ids = subcategories.map(cat => cat._id);
        for (const subcat of subcategories) {
          const childIds = await getSubcategoryIds(subcat._id);
          ids = [...ids, ...childIds];
        }
        return ids;
      };
      
      const subIds = await getSubcategoryIds(categoryId);
      categoryIds = [...categoryIds, ...subIds];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(
      { 
        categories: { $in: categoryIds },
        status: 'active',
        isPublished: true 
      }
    )
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('categories', 'name slug')
    .populate('primaryCategory', 'name slug');
    
    const total = await Product.countDocuments({ 
      categories: { $in: categoryIds },
      status: 'active',
      isPublished: true 
    });
    
    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.getFeaturedProducts(limit);
    
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get hot sale products
// @route   GET /api/products/hot-sale
// @access  Public
exports.getHotSaleProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.getHotSaleProducts(limit);
    
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get hot sale products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get top rated products
// @route   GET /api/products/top-rated
// @access  Public
exports.getTopRatedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.getTopRatedProducts(limit);
    
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get top rated products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// ADMIN ROUTES (Authentication required)
// ============================================

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin, Manager)
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    };
    
    // Parse JSON strings if sent as strings
    if (req.body.variations && typeof req.body.variations === 'string') {
      productData.variations = JSON.parse(req.body.variations);
    }
    if (req.body.colors && typeof req.body.colors === 'string') {
      productData.colors = JSON.parse(req.body.colors);
    }
    if (req.body.tags && typeof req.body.tags === 'string') {
      productData.tags = JSON.parse(req.body.tags);
    }
    if (req.body.seo && typeof req.body.seo === 'string') {
      productData.seo = JSON.parse(req.body.seo);
    }
    
    // Process categories
    let categoryIds = [];
    if (req.body.categories) {
      if (typeof req.body.categories === 'string') {
        categoryIds = JSON.parse(req.body.categories);
      } else if (Array.isArray(req.body.categories)) {
        categoryIds = req.body.categories;
      }
    }
    
    const primaryCategoryId = req.body.primaryCategory || (categoryIds[0] || null);
    const { categories, categoryNames, primaryCategory } = await processCategories(categoryIds, primaryCategoryId);
    
    productData.categories = categories;
    productData.categoryNames = categoryNames;
    productData.primaryCategory = primaryCategory;
    
    // Handle main image upload
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      productData.mainImage = extractImageMetadata(
        req.files.mainImage[0],
        req.body.mainImageAlt || '',
        req.body.mainImageCaption || ''
      );
    }
    
    // Handle thumbnail image upload
    if (req.files && req.files.thumbnailImage && req.files.thumbnailImage[0]) {
      productData.thumbnailImage = extractImageMetadata(
        req.files.thumbnailImage[0],
        req.body.thumbnailAlt || '',
        ''
      );
    }
    
    // Handle hover image upload
    if (req.files && req.files.hoverImage && req.files.hoverImage[0]) {
      productData.hoverImage = extractImageMetadata(
        req.files.hoverImage[0],
        req.body.hoverImageAlt || '',
        ''
      );
    }
    
    // Handle gallery images
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      const galleryAlts = req.body.galleryAlts ? JSON.parse(req.body.galleryAlts) : [];
      const galleryCaptions = req.body.galleryCaptions ? JSON.parse(req.body.galleryCaptions) : [];
      
      productData.gallery = req.files.gallery.map((file, index) => ({
        ...extractImageMetadata(file, galleryAlts[index] || '', galleryCaptions[index] || ''),
        order: index,
        isMain: index === 0 && (!productData.mainImage || !productData.mainImage.url)
      }));
    }
    
    const product = await Product.create(productData);
    
    await product.populate('categories primaryCategory createdBy', 'name email');
    
    // Create audit log
    await createAuditLog(
      req.user._id,
      'PRODUCT_CREATE',
      'Product',
      product._id,
      { productName: product.productName },
      'SUCCESS',
      req
    );
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    await createAuditLog(
      req.user._id,
      'PRODUCT_CREATE',
      'Product',
      null,
      { error: error.message },
      'FAILED',
      req
    );
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin, Manager)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const oldData = {
      productName: product.productName,
      price: product.price,
      status: product.status,
      isFeatured: product.isFeatured,
      isHotSale: product.isHotSale
    };
    
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };
    
    // Parse JSON strings
    if (req.body.variations && typeof req.body.variations === 'string') {
      updateData.variations = JSON.parse(req.body.variations);
    }
    if (req.body.colors && typeof req.body.colors === 'string') {
      updateData.colors = JSON.parse(req.body.colors);
    }
    if (req.body.tags && typeof req.body.tags === 'string') {
      updateData.tags = JSON.parse(req.body.tags);
    }
    if (req.body.seo && typeof req.body.seo === 'string') {
      updateData.seo = JSON.parse(req.body.seo);
    }
    
    // Process categories if provided
    if (req.body.categories) {
      let categoryIds = [];
      if (typeof req.body.categories === 'string') {
        categoryIds = JSON.parse(req.body.categories);
      } else if (Array.isArray(req.body.categories)) {
        categoryIds = req.body.categories;
      }
      
      const primaryCategoryId = req.body.primaryCategory || (categoryIds[0] || null);
      const { categories, categoryNames, primaryCategory } = await processCategories(categoryIds, primaryCategoryId);
      
      updateData.categories = categories;
      updateData.categoryNames = categoryNames;
      updateData.primaryCategory = primaryCategory;
    }
    
    // Handle new main image
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      if (product.mainImage && product.mainImage.publicId) {
        await cloudinary.uploader.destroy(product.mainImage.publicId);
      }
      
      updateData.mainImage = extractImageMetadata(
        req.files.mainImage[0],
        req.body.mainImageAlt || product.mainImage?.alt || '',
        req.body.mainImageCaption || product.mainImage?.caption || ''
      );
    }
    
    // Handle new thumbnail image
    if (req.files && req.files.thumbnailImage && req.files.thumbnailImage[0]) {
      if (product.thumbnailImage && product.thumbnailImage.publicId) {
        await cloudinary.uploader.destroy(product.thumbnailImage.publicId);
      }
      
      updateData.thumbnailImage = extractImageMetadata(
        req.files.thumbnailImage[0],
        req.body.thumbnailAlt || product.thumbnailImage?.alt || '',
        ''
      );
    }
    
    // Handle new hover image
    if (req.files && req.files.hoverImage && req.files.hoverImage[0]) {
      if (product.hoverImage && product.hoverImage.publicId) {
        await cloudinary.uploader.destroy(product.hoverImage.publicId);
      }
      
      updateData.hoverImage = extractImageMetadata(
        req.files.hoverImage[0],
        req.body.hoverImageAlt || product.hoverImage?.alt || '',
        ''
      );
    }
    
    // Handle new gallery images
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      const galleryAlts = req.body.galleryAlts ? JSON.parse(req.body.galleryAlts) : [];
      const galleryCaptions = req.body.galleryCaptions ? JSON.parse(req.body.galleryCaptions) : [];
      const currentGalleryCount = product.gallery.length;
      
      const newGallery = req.files.gallery.map((file, index) => ({
        ...extractImageMetadata(file, galleryAlts[index] || '', galleryCaptions[index] || ''),
        order: currentGalleryCount + index,
        isMain: false
      }));
      
      updateData.gallery = [...product.gallery, ...newGallery];
    }
    
    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categories primaryCategory updatedBy', 'name email');
    
    // Create audit log
    await createAuditLog(
      req.user._id,
      'PRODUCT_UPDATE',
      'Product',
      product._id,
      { old: oldData, new: { productName: product.productName, price: product.price, status: product.status } },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Manager)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Delete all images from Cloudinary
    const imagesToDelete = [];
    
    if (product.mainImage && product.mainImage.publicId) {
      imagesToDelete.push(product.mainImage.publicId);
    }
    if (product.thumbnailImage && product.thumbnailImage.publicId) {
      imagesToDelete.push(product.thumbnailImage.publicId);
    }
    if (product.hoverImage && product.hoverImage.publicId) {
      imagesToDelete.push(product.hoverImage.publicId);
    }
    if (product.gallery && product.gallery.length) {
      product.gallery.forEach(img => {
        if (img.publicId) imagesToDelete.push(img.publicId);
      });
    }
    
    for (const publicId of imagesToDelete) {
      await cloudinary.uploader.destroy(publicId);
    }
    
    // Delete color images
    if (product.colors && product.colors.length) {
      for (const color of product.colors) {
        if (color.images && color.images.length) {
          for (const img of color.images) {
            if (img.publicId) {
              await cloudinary.uploader.destroy(img.publicId);
            }
          }
        }
      }
    }
    
    await product.deleteOne();
    
    // Create audit log
    await createAuditLog(
      req.user._id,
      'PRODUCT_DELETE',
      'Product',
      product._id,
      { productName: product.productName },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update product rating
// @route   PUT /api/products/:id/rating
// @access  Private (Admin)
exports.updateRating = async (req, res) => {
  try {
    const { rating } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    await product.updateRating(rating);
    
    await createAuditLog(
      req.user._id,
      'PRODUCT_UPDATE',
      'Product',
      product._id,
      { action: 'rating_update', newRating: rating, totalReviews: product.totalReviews },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: product,
      message: 'Rating updated successfully'
    });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// IMAGE MANAGEMENT FUNCTIONS
// ============================================

// @desc    Upload gallery image to product
// @route   POST /api/products/:id/gallery
// @access  Private (Admin, Manager)
exports.uploadGalleryImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const newImage = extractImageMetadata(
      req.file,
      req.body.alt || '',
      req.body.caption || ''
    );
    
    newImage.order = product.gallery.length;
    newImage.isMain = false;
    
    product.gallery.push(newImage);
    await product.save();
    
    await createAuditLog(
      req.user._id,
      'IMAGE_UPLOAD',
      'Product',
      product._id,
      { imageUrl: newImage.url, type: 'gallery' },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: newImage
    });
  } catch (error) {
    console.error('Upload gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update image details (alt, caption)
// @route   PUT /api/products/:id/gallery/:imageId
// @access  Private (Admin, Manager)
exports.updateGalleryImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const image = product.gallery.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    if (req.body.alt !== undefined) image.alt = req.body.alt;
    if (req.body.caption !== undefined) image.caption = req.body.caption;
    
    await product.save();
    
    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('Update gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/products/:id/gallery/:imageId
// @access  Private (Admin, Manager)
exports.deleteGalleryImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const image = product.gallery.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
    
    image.remove();
    await product.save();
    
    await createAuditLog(
      req.user._id,
      'IMAGE_DELETE',
      'Product',
      product._id,
      { imageId: req.params.imageId, type: 'gallery' },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Reorder gallery images
// @route   PUT /api/products/:id/gallery/reorder
// @access  Private (Admin, Manager)
exports.reorderGalleryImages = async (req, res) => {
  try {
    const { orders } = req.body; // [{ imageId, order }]
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    for (const item of orders) {
      const image = product.gallery.id(item.imageId);
      if (image) {
        image.order = item.order;
      }
    }
    
    // Sort gallery by order
    product.gallery.sort((a, b) => a.order - b.order);
    
    await product.save();
    
    res.status(200).json({
      success: true,
      data: product.gallery
    });
  } catch (error) {
    console.error('Reorder gallery images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Set main gallery image
// @route   PUT /api/products/:id/gallery/:imageId/main
// @access  Private (Admin, Manager)
exports.setMainGalleryImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Set all gallery images isMain to false
    product.gallery.forEach(img => {
      img.isMain = img._id.toString() === req.params.imageId;
    });
    
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Main gallery image updated successfully'
    });
  } catch (error) {
    console.error('Set main gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update main image
// @route   PUT /api/products/:id/main-image
// @access  Private (Admin, Manager)
exports.updateMainImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    // Delete old main image
    if (product.mainImage && product.mainImage.publicId) {
      await cloudinary.uploader.destroy(product.mainImage.publicId);
    }
    
    product.mainImage = extractImageMetadata(
      req.file,
      req.body.alt || '',
      req.body.caption || ''
    );
    
    await product.save();
    
    res.status(200).json({
      success: true,
      data: product.mainImage
    });
  } catch (error) {
    console.error('Update main image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete main image
// @route   DELETE /api/products/:id/main-image
// @access  Private (Admin, Manager)
exports.deleteMainImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (product.mainImage && product.mainImage.publicId) {
      await cloudinary.uploader.destroy(product.mainImage.publicId);
      product.mainImage = undefined;
      await product.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Main image deleted successfully'
    });
  } catch (error) {
    console.error('Delete main image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// COLOR IMAGE MANAGEMENT FUNCTIONS
// ============================================

// @desc    Upload color images
// @route   POST /api/products/:id/colors/:colorId/images
// @access  Private (Admin, Manager)
exports.uploadColorImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!product.hasColors) {
      return res.status(400).json({
        success: false,
        message: 'Product does not have color variants enabled'
      });
    }
    
    const color = product.colors.id(req.params.colorId);
    if (!color) {
      return res.status(404).json({
        success: false,
        message: 'Color variant not found'
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }
    
    const alts = req.body.alts ? JSON.parse(req.body.alts) : [];
    const captions = req.body.captions ? JSON.parse(req.body.captions) : [];
    
    const newImages = req.files.map((file, index) => ({
      url: file.secure_url,
      publicId: file.public_id,
      isMain: color.images.length === 0 && index === 0,
      alt: alts[index] || '',
      caption: captions[index] || ''
    }));
    
    color.images.push(...newImages);
    await product.save();
    
    await createAuditLog(
      req.user._id,
      'COLOR_IMAGES_UPLOAD',
      'Product',
      product._id,
      { 
        colorId: req.params.colorId,
        colorName: color.name,
        imageCount: newImages.length 
      },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: newImages,
      message: `Uploaded ${newImages.length} image(s) for color ${color.name}`
    });
  } catch (error) {
    console.error('Upload color images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete color image
// @route   DELETE /api/products/:id/colors/:colorId/images/:imageId
// @access  Private (Admin, Manager)
exports.deleteColorImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const color = product.colors.id(req.params.colorId);
    if (!color) {
      return res.status(404).json({
        success: false,
        message: 'Color variant not found'
      });
    }
    
    const image = color.images.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
    
    const wasMain = image.isMain;
    image.remove();
    
    if (wasMain && color.images.length > 0) {
      color.images[0].isMain = true;
    }
    
    await product.save();
    
    await createAuditLog(
      req.user._id,
      'COLOR_IMAGE_DELETE',
      'Product',
      product._id,
      { 
        colorId: req.params.colorId,
        colorName: color.name,
        imagePublicId: image.publicId 
      },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete color image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Set main image for color
// @route   PUT /api/products/:id/colors/:colorId/images/:imageId/main
// @access  Private (Admin, Manager)
exports.setMainColorImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const color = product.colors.id(req.params.colorId);
    if (!color) {
      return res.status(404).json({
        success: false,
        message: 'Color variant not found'
      });
    }
    
    color.images.forEach(img => {
      img.isMain = img._id.toString() === req.params.imageId;
    });
    
    await product.save();
    
    await createAuditLog(
      req.user._id,
      'COLOR_MAIN_IMAGE_SET',
      'Product',
      product._id,
      { 
        colorId: req.params.colorId,
        colorName: color.name,
        imageId: req.params.imageId 
      },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Main image updated successfully'
    });
  } catch (error) {
    console.error('Set main color image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// STATISTICS FUNCTIONS
// ============================================

// @desc    Get product statistics
// @route   GET /api/products/stats/summary
// @access  Public
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const publishedProducts = await Product.countDocuments({ isPublished: true, status: 'active' });
    
    const featuredProducts = await Product.countDocuments({ isFeatured: true, isPublished: true });
    const hotSaleProducts = await Product.countDocuments({ isHotSale: true, isPublished: true });
    const topRatedProducts = await Product.countDocuments({ isTopRated: true, isPublished: true });
    
    const avgPriceResult = await Product.aggregate([
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]);
    const averagePrice = avgPriceResult[0]?.avgPrice || 0;
    
    const avgRatingResult = await Product.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = avgRatingResult[0]?.avgRating || 0;
    
    const topProducts = await Product.find({ isPublished: true })
      .sort({ sales: -1 })
      .limit(5)
      .select('productName sales price rating mainImage');
    
    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        publishedProducts,
        featuredProducts,
        hotSaleProducts,
        topRatedProducts,
        averagePrice,
        averageRating,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// SEO FUNCTIONS
// ============================================

// @desc    Update product SEO
// @route   PUT /api/products/:id/seo
// @access  Private (Admin, Manager)
exports.updateProductSEO = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.seo = {
      ...product.seo,
      ...req.body
    };
    
    await product.save();
    
    await createAuditLog(
      req.user._id,
      'SEO_UPDATE',
      'Product',
      product._id,
      { updatedFields: Object.keys(req.body) },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: product.seo
    });
  } catch (error) {
    console.error('Update product SEO error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// BULK OPERATIONS
// ============================================

// @desc    Bulk assign categories to products
// @route   POST /api/products/bulk/categories
// @access  Private (Admin, Manager)
exports.bulkAssignCategories = async (req, res) => {
  try {
    const { productIds, categoryIds, operation = 'add' } = req.body;
    
    if (!productIds || !productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }
    
    if (!categoryIds || !categoryIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Category IDs are required'
      });
    }
    
    const categories = await Category.find({ _id: { $in: categoryIds } });
    const categoryNames = categories.map(cat => cat.name.toLowerCase());
    
    let updateOperation;
    if (operation === 'add') {
      updateOperation = {
        $addToSet: { 
          categories: { $each: categoryIds },
          categoryNames: { $each: categoryNames }
        }
      };
    } else if (operation === 'remove') {
      updateOperation = {
        $pull: { 
          categories: { $in: categoryIds },
          categoryNames: { $in: categoryNames }
        }
      };
    } else if (operation === 'set') {
      updateOperation = {
        $set: { 
          categories: categoryIds,
          categoryNames: categoryNames
        }
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use add, remove, or set'
      });
    }
    
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      updateOperation
    );
    
    await createAuditLog(
      req.user._id,
      'PRODUCT_UPDATE',
      'Product',
      null,
      { action: 'bulk_category_assign', operation, productCount: result.modifiedCount, categoryIds },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: `Categories ${operation}ed successfully to ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk assign categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Bulk update product flags
// @route   PUT /api/products/bulk/flags
// @access  Private (Admin, Manager)
exports.bulkUpdateFlags = async (req, res) => {
  try {
    const { productIds, flags } = req.body;
    
    if (!productIds || !productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }
    
    if (!flags || typeof flags !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Flags object is required'
      });
    }
    
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: flags }
    );
    
    await createAuditLog(
      req.user._id,
      'PRODUCT_UPDATE',
      'Product',
      null,
      { action: 'bulk_flag_update', flags, productCount: result.modifiedCount },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: `Flags updated successfully for ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update flags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};