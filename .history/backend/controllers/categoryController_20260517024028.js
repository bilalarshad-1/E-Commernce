// controllers/categoryController.js - Complete Fixed Version
const Category = require('../models/Category');
const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const { hierarchical, status, page = 1, limit = 50 } = req.query;
    
    if (hierarchical === 'true') {
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
    
    const filter = {};
    if (status) filter.status = status;
    if (req.query.parentCategory) filter.parentCategory = req.query.parentCategory;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const categories = await Category.find(filter)
      .sort('order')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('parentCategory', 'name slug')
      .populate('subcategories', 'name slug');
    
    const total = await Category.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name slug')
      .populate('subcategories', 'name slug');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const productCount = await Product.countDocuments({ categories: category._id });
    
    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        productCount
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('parentCategory', 'name slug')
      .populate('subcategories', 'name slug');
    
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
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
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
    console.error('Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get products by category
// @route   GET /api/categories/:id/products
// @access  Public
exports.getCategoryProducts = async (req, res) => {
  try {
    const { includeSubcategories = 'true' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    let categoryIds = [req.params.id];
    
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
      
      const subIds = await getSubcategoryIds(req.params.id);
      categoryIds = [...categoryIds, ...subIds];
    }
    
    const skip = (page - 1) * limit;
    
    const products = await Product.find(
      { categories: { $in: categoryIds }, status: 'active', isPublished: true }
    )
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('primaryCategory', 'name slug')
    .populate('categories', 'name slug');
    
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
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get category products error:', error);
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

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin, Manager)
exports.createCategory = async (req, res) => {
  try {
    // Check if user exists (added by auth middleware)
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      parentCategory: req.body.parentCategory || null,
      status: req.body.status || 'active',
      isFeatured: req.body.isFeatured || false,
      order: req.body.order || 0,
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
    console.error('Create category error:', error);
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
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

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
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
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
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const productCount = await Product.countDocuments({ categories: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Remove or reassign products first.`
      });
    }
    
    const subcategoryCount = await Category.countDocuments({ parentCategory: category._id });
    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${subcategoryCount} subcategories. Delete subcategories first.`
      });
    }
    
    if (category.image && category.image.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }
    
    await category.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};