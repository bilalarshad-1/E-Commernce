// controllers/productController.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const auditLog = require('../middleware/auditMiddleware');
const { cloudinary } = require('../config/cloudinary');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

// Generate unique barcode number (NO IMAGE STORED)
const generateUniqueBarcodeNumber = async () => {
  const prefix = process.env.BARCODE_PREFIX || 'PROD';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const barcodeNumber = `${prefix}${timestamp}${random}`;
  
  // Check if barcode number already exists
  const existingProduct = await Product.findOne({ 'barcode.number': barcodeNumber });
  if (existingProduct) {
    return generateUniqueBarcodeNumber();
  }
  
  return barcodeNumber;
};

// Helper function to process categories
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
    if (req.body.inventory && typeof req.body.inventory === 'string') {
      productData.inventory = JSON.parse(req.body.inventory);
    }
    if (req.body.weight && typeof req.body.weight === 'string') {
      productData.weight = JSON.parse(req.body.weight);
    }
    if (req.body.dimensions && typeof req.body.dimensions === 'string') {
      productData.dimensions = JSON.parse(req.body.dimensions);
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
    
    // Handle main image upload to Cloudinary
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      productData.mainImage = {
        url: req.files.mainImage[0].path,
        publicId: req.files.mainImage[0].filename
      };
    }
    
    // Handle gallery images upload to Cloudinary
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      productData.gallery = req.files.gallery.map(file => ({
        url: file.path,
        publicId: file.filename,
        caption: ''
      }));
    }
    
    // Generate unique barcode number
    const barcodeNumber = await generateUniqueBarcodeNumber();
    productData.barcode = {
      number: barcodeNumber,
      format: 'CODE128'
    };
    
    const product = await Product.create(productData);
    
    // Set QR data after product is created
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    product.qrCode = {
      data: `${baseUrl}/products/${product._id}`
    };
    await product.save();
    
    // Populate category details
    await product.populate('categories primaryCategory');
    
    // Audit log - CORRECTED: pass status as string
    await auditLog(req, 'PRODUCT_CREATE', 'Product', product._id, {
      productName: product.productName,
      price: product.price
    }, 'SUCCESS');
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    // CORRECTED: pass error message as details, status as 'FAILED'
    await auditLog(req, 'PRODUCT_CREATE', 'Product', null, { error: error.message }, 'FAILED');
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || '-createdAt';
    
    const filter = {};
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.isPublished) filter.isPublished = req.query.isPublished === 'true';
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.minPrice) filter.price = { $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) };
    
    // Category filtering
    if (req.query.category) {
      let category = await Category.findById(req.query.category);
      if (!category) {
        category = await Category.findOne({ slug: req.query.category });
      }
      if (category) {
        filter.categories = { $in: [category._id] };
      }
    }
    
    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { productName: { $regex: req.query.search, $options: 'i' } },
        { shortDescription: { $regex: req.query.search, $options: 'i' } },
        { longDescription: { $regex: req.query.search, $options: 'i' } },
        { 'barcode.number': { $regex: req.query.search, $options: 'i' } },
        { categoryNames: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const options = {
      page,
      limit,
      sort,
      populate: [
        { path: 'categories', select: 'name slug image' },
        { path: 'primaryCategory', select: 'name slug' },
        { path: 'createdBy', select: 'name email' },
        { path: 'updatedBy', select: 'name email' }
      ]
    };
    
    const products = await Product.paginate(filter, options);
    
    // CORRECTED: pass details as object, not string
    await auditLog(req, 'VIEW', 'Product', null, { 
      action: 'viewed-products-list',
      filters: req.query 
    }, 'SUCCESS');
    
    res.status(200).json({
      success: true,
      data: products.docs,
      pagination: {
        total: products.totalDocs,
        page: products.page,
        pages: products.totalPages,
        limit: products.limit
      }
    });
  } catch (error) {
    await auditLog(req, 'VIEW', 'Product', null, { error: error.message }, 'FAILED');
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categories', 'name slug image description')
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
    
    await auditLog(req, 'PRODUCT_VIEW', 'Product', product._id, {
      productName: product.productName
    }, 'SUCCESS');
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    await auditLog(req, 'PRODUCT_VIEW', 'Product', req.params.id, { error: error.message }, 'FAILED');
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
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Generate barcode image on the fly
// @route   GET /api/products/:id/barcode-image
// @access  Public
exports.generateBarcodeImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product || !product.barcode || !product.barcode.number) {
      return res.status(404).json({
        success: false,
        message: 'Barcode not found'
      });
    }
    
    const scale = parseInt(req.query.scale) || 3;
    const height = parseInt(req.query.height) || 10;
    const includeText = req.query.includeText !== 'false';
    
    bwipjs.toBuffer({
      bcid: product.barcode.format.toLowerCase(),
      text: product.barcode.number,
      scale: scale,
      height: height,
      includetext: includeText,
      textxalign: 'center',
      textsize: 11
    }, (err, buffer) => {
      if (err) {
        console.error('Barcode generation error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error generating barcode'
        });
      }
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="barcode-${product.barcode.number}.png"`);
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Generate QR code image on the fly
// @route   GET /api/products/:id/qr-image
// @access  Public
exports.generateQRImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product || !product.qrCode || !product.qrCode.data) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }
    
    const size = parseInt(req.query.size) || 300;
    const margin = parseInt(req.query.margin) || 2;
    
    QRCode.toBuffer(product.qrCode.data, {
      errorCorrectionLevel: 'H',
      margin: margin,
      width: size
    }, (err, buffer) => {
      if (err) {
        console.error('QR generation error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error generating QR code'
        });
      }
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="qrcode-${product._id}.png"`);
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Download barcode as PNG
// @route   GET /api/products/:id/barcode-download
// @access  Public
exports.downloadBarcode = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product || !product.barcode || !product.barcode.number) {
      return res.status(404).json({
        success: false,
        message: 'Barcode not found'
      });
    }
    
    const scale = parseInt(req.query.scale) || 4;
    const height = parseInt(req.query.height) || 12;
    
    bwipjs.toBuffer({
      bcid: product.barcode.format.toLowerCase(),
      text: product.barcode.number,
      scale: scale,
      height: height,
      includetext: true,
      textxalign: 'center',
      textsize: 12
    }, (err, buffer) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error generating barcode'
        });
      }
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="barcode-${product.barcode.number}.png"`);
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Download QR code as PNG
// @route   GET /api/products/:id/qr-download
// @access  Public
exports.downloadQR = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product || !product.qrCode || !product.qrCode.data) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }
    
    const size = parseInt(req.query.size) || 400;
    
    QRCode.toBuffer(product.qrCode.data, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: size
    }, (err, buffer) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error generating QR code'
        });
      }
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="qrcode-${product.productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png"`);
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
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
      updateData.gallery = [...(product.gallery || []), ...newGallery];
    }
    
    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categories primaryCategory');
    
    // CORRECTED: pass details as object
    await auditLog(req, 'PRODUCT_UPDATE', 'Product', product._id, {
      productName: product.productName,
      updatedFields: Object.keys(req.body)
    }, 'SUCCESS');
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    await auditLog(req, 'PRODUCT_UPDATE', 'Product', req.params.id, { error: error.message }, 'FAILED');
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
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
    
    const productName = product.productName;
    await product.deleteOne();
    
    // CORRECTED: pass details as object
    await auditLog(req, 'PRODUCT_DELETE', 'Product', product._id, {
      productName: productName,
      deletedBy: req.user.email
    }, 'SUCCESS');
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    await auditLog(req, 'PRODUCT_DELETE', 'Product', req.params.id, { error: error.message }, 'FAILED');
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update stock
// @route   PUT /api/products/:id/stock
// @access  Private
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
          newStock = (variation.stock || 0) + stock;
          break;
        case 'decrease':
          newStock = Math.max(0, (variation.stock || 0) - stock);
          break;
        default:
          newStock = stock;
      }
      variation.stock = newStock;
    } else {
      oldStock = product.inventory?.currentStock || 0;
      switch(type) {
        case 'increase':
          newStock = (product.inventory?.currentStock || 0) + stock;
          break;
        case 'decrease':
          newStock = Math.max(0, (product.inventory?.currentStock || 0) - stock);
          break;
        default:
          newStock = stock;
      }
      product.inventory.currentStock = newStock;
    }
    
    await product.save();
    
    await auditLog(req, 'STOCK_UPDATE', 'Product', product._id, {
      productName: product.productName,
      variationId: variationId || null,
      oldStock,
      newStock,
      changeType: type,
      changeAmount: stock
    }, 'SUCCESS');
    
    res.status(200).json({
      success: true,
      data: product,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    await auditLog(req, 'STOCK_UPDATE', 'Product', req.params.id, { error: error.message }, 'FAILED');
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats/summary
// @access  Private
exports.getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $facet: {
          totalProducts: [{ $count: 'count' }],
          publishedProducts: [
            { $match: { isPublished: true, status: 'active' } },
            { $count: 'count' }
          ],
          lowStockProducts: [
            { 
              $match: { 
                $expr: { 
                  $lte: ['$inventory.currentStock', '$inventory.lowStockThreshold'] 
                }
              }
            },
            { $count: 'count' }
          ],
          outOfStockProducts: [
            { $match: { 'inventory.currentStock': 0 } },
            { $count: 'count' }
          ],
          averagePrice: [
            { $group: { _id: null, avgPrice: { $avg: '$price' } } }
          ],
          totalValue: [
            { 
              $group: { 
                _id: null, 
                totalValue: { 
                  $sum: { $multiply: ['$price', '$inventory.currentStock'] } 
                }
              }
            }
          ]
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalProducts: stats[0].totalProducts[0]?.count || 0,
        publishedProducts: stats[0].publishedProducts[0]?.count || 0,
        lowStockProducts: stats[0].lowStockProducts[0]?.count || 0,
        outOfStockProducts: stats[0].outOfStockProducts[0]?.count || 0,
        averagePrice: stats[0].averagePrice[0]?.avgPrice || 0,
        totalInventoryValue: stats[0].totalValue[0]?.totalValue || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Regenerate barcode for product
// @route   POST /api/products/:id/regenerate-barcode
// @access  Private
exports.regenerateBarcode = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const newBarcodeNumber = await generateUniqueBarcodeNumber();
    
    product.barcode = {
      number: newBarcodeNumber,
      format: product.barcode?.format || 'CODE128'
    };
    
    await product.save();
    
    await auditLog(req, 'PRODUCT_UPDATE', 'Product', product._id, {
      productName: product.productName,
      action: 'barcode_regenerated',
      oldBarcode: product.barcode?.number,
      newBarcode: newBarcodeNumber
    }, 'SUCCESS');
    
    res.status(200).json({
      success: true,
      message: 'Barcode regenerated successfully',
      data: {
        barcode: product.barcode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};