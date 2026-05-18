const Product = require('../models/Product');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { cloudinary } = require('../config/cloudinary');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique barcode number (no image)
const generateBarcodeNumber = (prefix = 'PROD') => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

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

// @desc    Get product by barcode
// @route   GET /api/products/barcode/:barcode
// @access  Public
exports.getProductByBarcode = async (req, res) => {
  try {
    let product = await Product.findOne({ 'barcode.number': req.params.barcode })
      .populate('categories', 'name slug')
      .populate('primaryCategory', 'name slug');
    
    if (!product) {
      // Check variations barcode
      product = await Product.findOne({ 'variations.barcode.number': req.params.barcode })
        .populate('categories', 'name slug')
        .populate('primaryCategory', 'name slug');
    }
    
    if (!product) {
      // Check colors barcode
      product = await Product.findOne({ 'colors.barcode.number': req.params.barcode })
        .populate('categories', 'name slug')
        .populate('primaryCategory', 'name slug');
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with this barcode'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by barcode error:', error);
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
    
    // Generate barcode number for main product (no image)
    if (!productData.barcode || !productData.barcode.number) {
      productData.barcode = {
        number: generateBarcodeNumber('PROD'),
        format: 'CODE128'
      };
    }
    
    // Handle variations barcodes
    if (productData.hasVariations && productData.variations) {
      productData.variations = productData.variations.map(variation => ({
        ...variation,
        barcode: variation.barcode || { number: generateBarcodeNumber('VAR') },
        qrCode: variation.qrCode || { data: null } // Will be set in pre-save
      }));
    }
    
    // Handle colors barcodes
    if (productData.hasColors && productData.colors) {
      productData.colors = productData.colors.map(color => ({
        ...color,
        barcode: color.barcode || { number: generateBarcodeNumber('CLR') },
        qrCode: color.qrCode || { data: null } // Will be set in pre-save
      }));
    }
    
    // Handle main image upload
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      productData.mainImage = {
        url: req.files.mainImage[0].path,
        publicId: req.files.mainImage[0].filename
      };
    }
    
    // Handle gallery images
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      productData.gallery = req.files.gallery.map(file => ({
        url: file.path,
        publicId: file.filename,
        caption: ''
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
      { productName: product.productName, sku: product.barcode?.number },
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
      
      updateData.mainImage = {
        url: req.files.mainImage[0].path,
        publicId: req.files.mainImage[0].filename
      };
    }
    
    // Handle new gallery images
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      const newGallery = req.files.gallery.map(file => ({
        url: file.path,
        publicId: file.filename,
        caption: ''
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
    
    // Delete main image from Cloudinary
    if (product.mainImage && product.mainImage.publicId) {
      await cloudinary.uploader.destroy(product.mainImage.publicId);
    }
    
    // Delete gallery images from Cloudinary
    for (const image of product.gallery) {
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }
    
    await product.deleteOne();
    
    // Create audit log
    await createAuditLog(
      req.user._id,
      'PRODUCT_DELETE',
      'Product',
      product._id,
      { productName: product.productName, barcode: product.barcode?.number },
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

// @desc    Update stock (supports variations and colors)
// @route   PUT /api/products/:id/stock
// @access  Private (Admin, Manager)
exports.updateStock = async (req, res) => {
  try {
    const { stock, variationId, colorId, type = 'set' } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    let oldStock, newStock;
    let targetType = 'main';
    
    if (variationId && product.hasVariations) {
      const variation = product.variations.id(variationId);
      if (!variation) {
        return res.status(404).json({
          success: false,
          message: 'Variation not found'
        });
      }
      
      oldStock = variation.stock;
      targetType = `variation: ${variation.name}`;
      
      switch(type) {
        case 'increase':
          newStock = variation.stock + stock;
          break;
        case 'decrease':
          newStock = Math.max(0, variation.stock - stock);
          break;
        default:
          newStock = stock;
      }
      
      variation.stock = newStock;
    } else if (colorId && product.hasColors) {
      const color = product.colors.id(colorId);
      if (!color) {
        return res.status(404).json({
          success: false,
          message: 'Color not found'
        });
      }
      
      oldStock = color.stock;
      targetType = `color: ${color.name}`;
      
      switch(type) {
        case 'increase':
          newStock = color.stock + stock;
          break;
        case 'decrease':
          newStock = Math.max(0, color.stock - stock);
          break;
        default:
          newStock = stock;
      }
      
      color.stock = newStock;
    } else {
      oldStock = product.inventory.currentStock;
      
      switch(type) {
        case 'increase':
          newStock = product.inventory.currentStock + stock;
          break;
        case 'decrease':
          newStock = Math.max(0, product.inventory.currentStock - stock);
          break;
        default:
          newStock = stock;
      }
      
      product.inventory.currentStock = newStock;
    }
    
    await product.save();
    
    // Create audit log
    await createAuditLog(
      req.user._id,
      'STOCK_UPDATE',
      'Product',
      product._id,
      { target: targetType, oldStock, newStock, change: stock, type },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: product,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Update stock error:', error);
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

// @desc    Upload product image
// @route   POST /api/products/:id/images
// @access  Private (Admin, Manager)
exports.uploadProductImage = async (req, res) => {
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
    
    const newImage = {
      url: req.file.path,
      publicId: req.file.filename,
      caption: req.body.caption || ''
    };
    
    product.gallery.push(newImage);
    await product.save();
    
    await createAuditLog(
      req.user._id,
      'IMAGE_UPLOAD',
      'Product',
      product._id,
      { imageUrl: newImage.url },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: newImage
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (Admin, Manager)
exports.deleteProductImage = async (req, res) => {
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
      { imageId: req.params.imageId },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats/summary
// @access  Public
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const publishedProducts = await Product.countDocuments({ isPublished: true, status: 'active' });
    
    // Calculate low stock using totalStock virtual
    const allProducts = await Product.find();
    const lowStockProducts = allProducts.filter(p => p.isLowStock).length;
    const outOfStockProducts = allProducts.filter(p => p.isOutOfStock).length;
    
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
      .select('productName sales price rating');
    
    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        publishedProducts,
        lowStockProducts,
        outOfStockProducts,
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
// controllers/productController.js - ADD NEW FUNCTIONS

// ============================================
// COLOR IMAGE UPLOAD FUNCTIONS
// ============================================

// @desc    Upload color images for product
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
    
    const newImages = req.files.map((file, index) => ({
      url: file.path,
      publicId: file.filename,
      isMain: color.images.length === 0 && index === 0 // First image becomes main if no images exist
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
// @route   DELETE /api/products/:id/colors/:colorId/images/:imageIndex
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
    
    const imageIndex = parseInt(req.params.imageIndex);
    if (imageIndex >= color.images.length) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    const image = color.images[imageIndex];
    
    // Delete from Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
    
    // Remove image from array
    color.images.splice(imageIndex, 1);
    
    // If the deleted image was main and there are other images, set the first as main
    if (image.isMain && color.images.length > 0) {
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
// @route   PUT /api/products/:id/colors/:colorId/images/:imageIndex/main
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
    
    const imageIndex = parseInt(req.params.imageIndex);
    if (imageIndex >= color.images.length) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Set all images isMain to false, then set selected as main
    color.images.forEach((img, idx) => {
      img.isMain = (idx === imageIndex);
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
        imageIndex: imageIndex 
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
// REVIEW FUNCTIONS
// ============================================

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const Review = mongoose.model('Review');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({ product: req.params.id, isApproved: true })
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments({ product: req.params.id, isApproved: true });
    
    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private (Authenticated users who purchased)
exports.createProductReview = async (req, res) => {
  try {
    const Review = mongoose.model('Review');
    const Order = mongoose.model('Order');
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': req.params.id,
      status: 'delivered'
    });
    
    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased'
      });
    }
    
    // Check if user already reviewed
    const existingReview = await Review.findOne({
      product: req.params.id,
      user: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }
    
    const { rating, title, comment, images } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const review = await Review.create({
      product: req.params.id,
      user: req.user._id,
      rating,
      title,
      comment,
      images: images || [],
      isApproved: true, // Auto-approve or set to false for moderation
      verifiedPurchase: true
    });
    
    // Update product rating
    await product.updateRating(rating);
    
    await createAuditLog(
      req.user._id,
      'REVIEW_CREATE',
      'Review',
      review._id,
      { productId: product._id, productName: product.productName, rating },
      'SUCCESS',
      req
    );
    
    await review.populate('user', 'name email');
    
    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update product review
// @route   PUT /api/products/:id/reviews/:reviewId
// @access  Private (Review owner or Admin)
exports.updateProductReview = async (req, res) => {
  try {
    const Review = mongoose.model('Review');
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check ownership or admin
    if (review.user.toString() !== req.user._id.toString() && 
        !['admin', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }
    
    const oldRating = review.rating;
    const { rating, title, comment, images } = req.body;
    
    // Update review fields
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (images) review.images = images;
    
    await review.save();
    
    // Update product rating if rating changed
    if (rating && rating !== oldRating) {
      const product = await Product.findById(review.product);
      const allReviews = await Review.find({ product: review.product, isApproved: true });
      
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = totalRating / allReviews.length;
      product.isTopRated = product.rating >= 4.5;
      
      await product.save();
    }
    
    await createAuditLog(
      req.user._id,
      'REVIEW_UPDATE',
      'Review',
      review._id,
      { productId: review.product, oldRating, newRating: rating },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      data: review,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete product review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private (Review owner or Admin)
exports.deleteProductReview = async (req, res) => {
  try {
    const Review = mongoose.model('Review');
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check ownership or admin
    if (review.user.toString() !== req.user._id.toString() && 
        !['admin', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }
    
    await review.deleteOne();
    
    // Update product rating
    const product = await Product.findById(review.product);
    const allReviews = await Review.find({ product: review.product, isApproved: true });
    
    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = totalRating / allReviews.length;
    } else {
      product.rating = 0;
      product.totalReviews = 0;
      product.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
    
    product.isTopRated = product.rating >= 4.5;
    await product.save();
    
    await createAuditLog(
      req.user._id,
      'REVIEW_DELETE',
      'Review',
      review._id,
      { productId: review.product },
      'SUCCESS',
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get review statistics for product
// @route   GET /api/products/:id/reviews/stats
// @access  Public
exports.getProductReviewStats = async (req, res) => {
  try {
    const Review = mongoose.model('Review');
    
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.id), isApproved: true } },
      { $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }}
    ]);
    
    let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    if (stats.length > 0) {
      stats[0].ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });
    }
    
    const result = {
      averageRating: stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0,
      totalReviews: stats.length > 0 ? stats[0].totalReviews : 0,
      distribution
    };
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};