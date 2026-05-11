const Category = require('../models/Category');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const auditLog = require('../middleware/auditMiddleware');
const { cloudinary } = require('../config/cloudinary');

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin, Manager)
exports.createCategory = async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    };
    
    // Handle parent category and level
    if (categoryData.parentCategory) {
      const parentCategory = await Category.findById(categoryData.parentCategory);
      if (parentCategory) {
        categoryData.level = parentCategory.level + 1;
      }
    }
    
    // Handle image upload
    if (req.file) {
      categoryData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }
    
    const category = await Category.create(categoryData);
    
    await auditLog(req, 'CATEGORY_CREATE', 'Category', category._id, {
      categoryName: category.name,
      level: category.level
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
exports.getCategories = async (req, res) => {
  try {
    const { hierarchical, status, page = 1, limit = 50 } = req.query;
    
    if (hierarchical === 'true') {
      // Return hierarchical structure
      const categories = await Category.find({ 
        parentCategory: null,
        status: status || 'active'
      })
      .sort('order')
      .populate({
        path: 'subcategories',
        match: status ? { status } : {},
        options: { sort: { order: 1 } }
      });
      
      return res.status(200).json({
        success: true,
        data: categories
      });
    }
    
    // Regular paginated list
    const filter = {};
    if (status) filter.status = status;
    if (req.query.parentCategory) filter.parentCategory = req.query.parentCategory;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: 'order',
      populate: 'parentCategory subcategories createdBy updatedBy'
    };
    
    const categories = await Category.paginate(filter, options);
    
    await auditLog(req, 'VIEW', 'Category', null, { 
      action: 'viewed-categories-list'
    });
    
    res.status(200).json({
      success: true,
      data: categories.docs,
      pagination: {
        total: categories.totalDocs,
        page: categories.page,
        pages: categories.totalPages,
        limit: categories.limit
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

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory')
      .populate('subcategories')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get product count for this category
    const productCount = await Product.countDocuments({ categories: category._id });
    
    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        productCount
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

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Private
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('parentCategory')
      .populate('subcategories');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin, Manager)
exports.updateCategory = async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };
    
    // Handle parent category and level
    if (updateData.parentCategory && updateData.parentCategory !== category.parentCategory?.toString()) {
      const parentCategory = await Category.findById(updateData.parentCategory);
      if (parentCategory) {
        updateData.level = parentCategory.level + 1;
      }
    }
    
    // Handle new image
    if (req.file) {
      // Delete old image from Cloudinary
      if (category.image && category.image.publicId) {
        await cloudinary.uploader.destroy(category.image.publicId);
      }
      
      updateData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }
    
    category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    await auditLog(req, 'CATEGORY_UPDATE', 'Category', category._id, {
      categoryName: category.name,
      updatedFields: Object.keys(req.body)
    });
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has products
    const productCount = await Product.countDocuments({ categories: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Remove or reassign products first.`
      });
    }
    
    // Check for subcategories
    const subcategoryCount = await Category.countDocuments({ parentCategory: category._id });
    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${subcategoryCount} subcategories. Delete subcategories first.`
      });
    }
    
    // Delete image from Cloudinary
    if (category.image && category.image.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }
    
    await category.deleteOne();
    
    await auditLog(req, 'CATEGORY_DELETE', 'Category', category._id, {
      categoryName: category.name
    });
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get category tree (all categories with hierarchy)
// @route   GET /api/categories/tree
// @access  Private
exports.getCategoryTree = async (req, res) => {
  try {
    const buildTree = async (parentId = null) => {
      const categories = await Category.find({ 
        parentCategory: parentId,
        status: 'active'
      })
      .sort('order')
      .lean();
      
      const tree = [];
      for (const category of categories) {
        const children = await buildTree(category._id);
        tree.push({
          ...category,
          children
        });
      }
      return tree;
    };
    
    const categoryTree = await buildTree();
    
    res.status(200).json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get products by category
// @route   GET /api/categories/:id/products
// @access  Private
exports.getCategoryProducts = async (req, res) => {
  try {
    const { includeSubcategories = true } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    let categoryIds = [req.params.id];
    
    if (includeSubcategories === 'true') {
      // Get all subcategory IDs
      const getSubcategoryIds = async (parentId) => {
        const subcategories = await Category.find({ parentCategory: parentId });
        let ids = subcategories.map(cat => cat._id);
        for (const subcat of subcategories) {
          const childIds = await getSubcategoryIds(subcat._id);
          ids = [...ids, ...childIds];
        }
        return ids;
      };
      
      const subIds = await getSubcategoryIds(req.params.id);
      categoryIds = [...categoryIds, ...subIds];
    }
    
    const products = await Product.paginate(
      { categories: { $in: categoryIds }, status: 'active', isPublished: true },
      { page, limit, sort: '-createdAt', populate: 'primaryCategory categories' }
    );
    
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