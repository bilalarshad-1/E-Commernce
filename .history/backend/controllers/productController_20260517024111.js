const Product = require('../models/Product');
const Category = require('../models/Category');
const { cloudinary } = require('../config/cloudinary');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique barcode
const generateBarcode = async (productName) => {
  const prefix = process.env.BARCODE_PREFIX || 'PROD';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const barcodeNumber = `${prefix}${timestamp}${random}`;
  
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid: 'code128',
      text: barcodeNumber,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center'
    }, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        cloudinary.uploader.upload_stream({
          folder: 'products/barcodes',
          public_id: `barcode_${barcodeNumber}`
        }, (error, result) => {
          if (error) reject(error);
          else resolve({ number: barcodeNumber, imageUrl: result.secure_url });
        }).end(buffer);
      }
    });
  });
};

// Generate QR code
const generateQRCode = async (productId, productName) => {
  const qrData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/product/${productId}`;
  const qrImageUrl = await QRCode.toDataURL(qrData);
  
  const result = await cloudinary.uploader.upload(qrImageUrl, {
    folder: 'products/qrcodes',
    public_id: `qr_${productId}`
  });
  
  return {
    data: qrData,
    imageUrl: result.secure_url
  };
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
    else sortOption = { createdAt: -1 };
    
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('categories', 'name slug')
      .populate('primaryCategory', 'name slug');
    
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
      .populate('primaryCategory', 'name slug');
    
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
    const product = await Product.findOne({ 'barcode.number': req.params.barcode })
      .populate('categories', 'name slug')
      .populate('primaryCategory', 'name slug');
    
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
    
    // Generate barcode
    const barcode = await generateBarcode(productData.productName);
    productData.barcode = barcode;
    
    const product = await Product.create(productData);
    
    // Generate QR code
    const qrCode = await generateQRCode(product._id, product.productName);
    product.qrCode = qrCode;
    await product.save();
    
    await product.populate('categories primaryCategory');
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
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
    if (req.files && req.files.mainImage) {
      if (product.mainImage && product.mainImage.publicId) {
        await cloudinary.uploader.destroy(product.mainImage.publicId);
      }
      
      updateData.mainImage = {
        url: req.files.mainImage[0].path,
        publicId: req.files.mainImage[0].filename
      };
    }
    
    // Handle new gallery images
    if (req.files && req.files.gallery) {
      const newGallery = req.files.gallery.map(file => ({
        url: file.path,
        publicId: file.filename,
        caption: ''
      }));
      updateData.gallery = [...product.gallery, ...newGallery];
    }
    
    // Regenerate QR if product name changed
    if (product.productName !== req.body.productName) {
      const qrCode = await generateQRCode(product._id, req.body.productName);
      updateData.qrCode = qrCode;
    }
    
    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categories primaryCategory');
    
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
    
    // Delete barcode image
    if (product.barcode && product.barcode.imageUrl) {
      const publicId = product.barcode.imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/barcodes/${publicId}`);
    }
    
    // Delete QR code image
    if (product.qrCode && product.qrCode.imageUrl) {
      const publicId = product.qrCode.imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/qrcodes/${publicId}`);
    }
    
    await product.deleteOne();
    
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

// @desc    Update stock
// @route   PUT /api/products/:id/stock
// @access  Private (Admin, Manager)
exports.updateStock = async (req, res) => {
  try {
    const { stock, variationId, type = 'set' } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    let oldStock, newStock;
    
    if (variationId && product.hasVariations) {
      const variation = product.variations.id(variationId);
      if (!variation) {
        return res.status(404).json({
          success: false,
          message: 'Variation not found'
        });
      }
      
      oldStock = variation.stock;
      
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
// @access  Private (Admin, Manager)
// In productController.js, replace the getProductStats function:

// @desc    Get product statistics
// @route   GET /api/products/stats/summary
// @access  Public (change to public or keep admin)
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const publishedProducts = await Product.countDocuments({ isPublished: true, status: 'active' });
    
    // Fix the lowStockProducts query - don't use $expr with string comparison
    const allProducts = await Product.find();
    const lowStockProducts = allProducts.filter(p => 
      (p.inventory?.currentStock || 0) <= (p.inventory?.lowStockThreshold || 10)
    ).length;
    
    const outOfStockProducts = await Product.countDocuments({ 'inventory.currentStock': 0 });
    
    const avgPriceResult = await Product.aggregate([
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]);
    const averagePrice = avgPriceResult[0]?.avgPrice || 0;
    
    const topProducts = await Product.find()
      .sort({ sales: -1 })
      .limit(5)
      .select('productName sales price');
    
    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        publishedProducts,
        lowStockProducts,
        outOfStockProducts,
        averagePrice,
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