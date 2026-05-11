// Add this helper function at the top
const Category = require('../models/Category');

// Updated createProduct function with category validation
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    };
    
    // Parse JSON strings
    if (req.body.variations && typeof req.body.variations === 'string') {
      productData.variations = JSON.parse(req.body.variations);
    }
    if (req.body.colors && typeof req.body.colors === 'string') {
      productData.colors = JSON.parse(req.body.colors);
    }
    if (req.body.tags && typeof req.body.tags === 'string') {
      productData.tags = JSON.parse(req.body.tags);
    }
    
    // Handle categories - can be IDs or names
    if (req.body.categories) {
      let categoryIds = [];
      let categoryNames = [];
      
      if (typeof req.body.categories === 'string') {
        const parsed = JSON.parse(req.body.categories);
        categoryIds = parsed;
      } else if (Array.isArray(req.body.categories)) {
        categoryIds = req.body.categories;
      }
      
      // Validate and get category names
      if (categoryIds.length > 0) {
        const categories = await Category.find({ _id: { $in: categoryIds } });
        categoryNames = categories.map(cat => cat.name);
        productData.categoryNames = categoryNames;
        productData.categories = categoryIds;
      }
    }
    
    // Handle primary category
    if (req.body.primaryCategory) {
      const primaryCat = await Category.findById(req.body.primaryCategory);
      if (primaryCat) {
        productData.primaryCategory = req.body.primaryCategory;
      }
    }
    
    // Handle main image upload (same as before)
    if (req.files && req.files.mainImage) {
      productData.mainImage = {
        url: req.files.mainImage[0].path,
        publicId: req.files.mainImage[0].filename
      };
    }
    
    // Handle gallery images (same as before)
    if (req.files && req.files.gallery) {
      productData.gallery = req.files.gallery.map(file => ({
        url: file.path,
        publicId: file.filename
      }));
    }
    
    // Generate barcode and QR code (same as before)
    const barcode = await generateBarcode(productData.productName);
    productData.barcode = barcode;
    
    const product = await Product.create(productData);
    
    const qrCode = await generateQRCode(product._id, product.productName);
    product.qrCode = qrCode;
    await product.save();
    
    await auditLog(req, 'PRODUCT_CREATE', 'Product', product._id, {
      productName: product.productName,
      categories: productData.categoryNames
    });
    
    res.status(201).json({
      success: true,
      data: await product.populate('categories primaryCategory')
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

// Updated getProducts with category filtering
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || '-createdAt';
    
    // Build filter object
    const filter = {};
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.isPublished) filter.isPublished = req.query.isPublished === 'true';
    if (req.query.search) {
      filter.$or = [
        { productName: { $regex: req.query.search, $options: 'i' } },
        { shortDescription: { $regex: req.query.search, $options: 'i' } },
        { 'barcode.number': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Enhanced category filtering
    if (req.query.category) {
      // Check if category is ID or slug/name
      let categoryId = req.query.category;
      let categoryIds = [];
      
      // Try to find category by ID or slug
      let category = await Category.findById(categoryId);
      if (!category) {
        category = await Category.findOne({ 
          $or: [
            { slug: categoryId },
            { name: { $regex: new RegExp(`^${categoryId}$`, 'i') } }
          ]
        });
      }
      
      if (category) {
        const includeSubcategories = req.query.includeSubcategories === 'true';
        
        if (includeSubcategories) {
          // Get all subcategory IDs recursively
          const getSubcategoryIds = async (parentId) => {
            const subcategories = await Category.find({ parentCategory: parentId });
            let ids = subcategories.map(cat => cat._id);
            for (const subcat of subcategories) {
              const childIds = await getSubcategoryIds(subcat._id);
              ids = [...ids, ...childIds];
            }
            return ids;
          };
          
          const subIds = await getSubcategoryIds(category._id);
          categoryIds = [category._id, ...subIds];
        } else {
          categoryIds = [category._id];
        }
        
        filter.categories = { $in: categoryIds };
      } else {
        // If category not found, try direct slug match in categoryNames
        filter.categoryNames = { $regex: new RegExp(categoryId, 'i') };
      }
    }
    
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.minPrice) filter.price = { $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) };
    
    const options = {
      page,
      limit,
      sort,
      populate: 'categories primaryCategory createdBy updatedBy',
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

// Add bulk category assignment function
exports.assignCategoriesToProducts = async (req, res) => {
  try {
    const { productIds, categoryIds, operation = 'add' } = req.body;
    
    if (!productIds || !categoryIds) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs and Category IDs are required'
      });
    }
    
    const categories = await Category.find({ _id: { $in: categoryIds } });
    const categoryNames = categories.map(cat => cat.name);
    
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
    }
    
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      updateOperation
    );
    
    await auditLog(req, 'CATEGORY_ASSIGN', 'Product', null, {
      productCount: productIds.length,
      categoryIds,
      operation,
      modifiedCount: result.modifiedCount
    });
    
    res.status(200).json({
      success: true,
      message: `Categories ${operation}ed successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};