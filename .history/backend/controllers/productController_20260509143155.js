const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const auditLog = require('../middleware/auditMiddleware');
const { cloudinary } = require('../config/cloudinary');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const { v4: uuidv4 } = require('uuid');

// Generate unique barcode
const generateBarcode = async (productName) => {
  const prefix = process.env.BARCODE_PREFIX || 'PROD';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const barcodeNumber = `${prefix}${timestamp}${random}`;
  
  // Generate barcode image using bwip-js
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
        // Upload to Cloudinary
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
  const qrData = `${process.env.QR_BASE_URL}/product/${productId}`;
  const qrImageUrl = await QRCode.toDataURL(qrData);
  
  // Upload QR to Cloudinary
  const result = await cloudinary.uploader.upload(qrImageUrl, {
    folder: 'products/qrcodes',
    public_id: `qr_${productId}`
  });
  
  return {
    data: qrData,
    imageUrl: result.secure_url
  };
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
    if (req.body.categories && typeof req.body.categories === 'string') {
      productData.categories = JSON.parse(req.body.categories);
    }
    
    // Handle main image upload
    if (req.files && req.files.mainImage) {
      productData.mainImage = {
        url: req.files.mainImage[0].path,
        publicId: req.files.mainImage[0].filename
      };
    }
    
    // Handle gallery images
    if (req.files && req.files.gallery) {
      productData.gallery = req.files.gallery.map(file => ({
        url: file.path,
        publicId: file.filename
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
    
    await auditLog(req, 'PRODUCT_CREATE', 'Product', product._id, {
      productName: product.productName,
      price: product.price
    });
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
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
    
    // Build filter object
    const filter = {};
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.isPublished) filter.isPublished = req.query.isPublished === 'true';
    if (req.query.category) filter.categories = req.query.category;
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.minPrice) filter.price = { $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) };
    if (req.query.search) {
      filter.$or = [
        { productName: { $regex: req.query.search, $options: 'i' } },
        { shortDescription: { $regex: req.query.search, $options: 'i' } },
        { 'barcode.number': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const options = {
      page,
      limit,
      sort,
      populate: 'createdBy updatedBy',
      lean: false
    };
    
    const products = await Product.paginate(filter, options);
    
    await auditLog(req, 'VIEW', 'Product', null, { 
      action: 'viewed-products-list',
      filters: req.query 
    });
    
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
    });
    
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

// @desc    Get product by barcode
// @route   GET /api/products/barcode/:barcode
// @access  Private
exports.getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({ 'barcode.number': req.params.barcode });
    
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
    if (req.body.categories && typeof req.body.categories === 'string') {
      updateData.categories = JSON.parse(req.body.categories);
    }
    
    // Handle new main image
    if (req.files && req.files.mainImage) {
      // Delete old image from Cloudinary
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
        publicId: file.filename
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
    );
    
    await auditLog(req, 'PRODUCT_UPDATE', 'Product', product._id, {
      productName: product.productName,
      updatedFields: Object.keys(req.body)
    });
    
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
    
    // Delete color images
    for (const color of product.colors) {
      for (const image of color.images) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }
    
    await product.deleteOne();
    
    await auditLog(req, 'PRODUCT_DELETE', 'Product', product._id, {
      productName: product.productName,
      deletedBy: req.user.email
    });
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
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
    
    await auditLog(req, 'STOCK_UPDATE', 'Product', product._id, {
      productName: product.productName,
      variationId,
      oldStock,
      newStock,
      changeType: type,
      changeAmount: stock
    });
    
    res.status(200).json({
      success: true,
      data: product,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Upload product image
// @route   POST /api/products/:id/images
// @access  Private
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
    
    await auditLog(req, 'IMAGE_UPLOAD', 'Product', product._id, {
      action: 'uploaded-gallery-image',
      imageUrl: req.file.path
    });
    
    res.status(200).json({
      success: true,
      data: newImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private
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
    
    // Delete from Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
    
    image.remove();
    await product.save();
    
    await auditLog(req, 'IMAGE_DELETE', 'Product', product._id, {
      action: 'deleted-gallery-image',
      imageId: req.params.imageId
    });
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
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
exports.getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $facet: {
          totalProducts: [
            { $count: 'count' }
          ],
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
          ],
          topProducts: [
            { $sort: { sales: -1 } },
            { $limit: 5 },
            { 
              $project: { 
                productName: 1, 
                sales: 1, 
                price: 1,
                totalRevenue: { $multiply: ['$sales', '$price'] }
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
        totalInventoryValue: stats[0].totalValue[0]?.totalValue || 0,
        topProducts: stats[0].topProducts
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