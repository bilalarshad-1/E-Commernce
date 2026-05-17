const Hero = require('../models/Hero');
const { cloudinary } = require('../config/cloudinary');

// ============================================
// PUBLIC ROUTES
// ============================================

// @desc    Get all active hero slides
// @route   GET /api/hero
// @access  Public
exports.getHeroSlides = async (req, res) => {
  try {
    const slides = await Hero.find({ isActive: true })
      .sort('order')
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: slides.length,
      data: slides
    });
  } catch (error) {
    console.error('Get hero slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single hero slide
// @route   GET /api/hero/:id
// @access  Public
exports.getHeroSlide = async (req, res) => {
  try {
    const slide = await Hero.findById(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: slide
    });
  } catch (error) {
    console.error('Get hero slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// ADMIN ROUTES
// ============================================

// @desc    Create hero slide
// @route   POST /api/admin/hero
// @access  Private/Admin
exports.createHeroSlide = async (req, res) => {
  try {
    const { title, subtitle, buttonText, buttonUrl, order, isActive } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Background image is required'
      });
    }
    
    // Check if order already exists
    if (order) {
      const existingOrder = await Hero.findOne({ order });
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: `Order ${order} already exists. Please use a different order number.`
        });
      }
    }
    
    const slideData = {
      title,
      subtitle: subtitle || '',
      buttonText: buttonText || 'Shop Now',
      buttonUrl: buttonUrl || '/shop',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      bgImage: {
        url: req.file.path,
        publicId: req.file.filename
      }
    };
    
    const slide = await Hero.create(slideData);
    
    res.status(201).json({
      success: true,
      data: slide
    });
  } catch (error) {
    console.error('Create hero slide error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Order number already exists. Please use a different number.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update hero slide
// @route   PUT /api/admin/hero/:id
// @access  Private/Admin
exports.updateHeroSlide = async (req, res) => {
  try {
    let slide = await Hero.findById(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found'
      });
    }
    
    const updateData = {
      title: req.body.title || slide.title,
      subtitle: req.body.subtitle !== undefined ? req.body.subtitle : slide.subtitle,
      buttonText: req.body.buttonText || slide.buttonText,
      buttonUrl: req.body.buttonUrl || slide.buttonUrl,
      order: req.body.order !== undefined ? req.body.order : slide.order,
      isActive: req.body.isActive !== undefined ? req.body.isActive : slide.isActive,
      updatedAt: Date.now()
    };
    
    // Check if order is being changed and if new order exists
    if (req.body.order !== undefined && req.body.order !== slide.order) {
      const existingOrder = await Hero.findOne({ order: req.body.order, _id: { $ne: req.params.id } });
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: `Order ${req.body.order} already exists. Please use a different order number.`
        });
      }
    }
    
    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (slide.bgImage && slide.bgImage.publicId) {
        await cloudinary.uploader.destroy(slide.bgImage.publicId);
      }
      
      updateData.bgImage = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }
    
    const updatedSlide = await Hero.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedSlide
    });
  } catch (error) {
    console.error('Update hero slide error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Order number already exists. Please use a different number.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete hero slide
// @route   DELETE /api/admin/hero/:id
// @access  Private/Admin
exports.deleteHeroSlide = async (req, res) => {
  try {
    const slide = await Hero.findById(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found'
      });
    }
    
    // Delete image from Cloudinary
    if (slide.bgImage && slide.bgImage.publicId) {
      await cloudinary.uploader.destroy(slide.bgImage.publicId);
    }
    
    await slide.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Hero slide deleted successfully'
    });
  } catch (error) {
    console.error('Delete hero slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Reorder hero slides
// @route   POST /api/admin/hero/reorder
// @access  Private/Admin
exports.reorderHeroSlides = async (req, res) => {
  try {
    const { slides } = req.body; // Array of { id, order }
    
    for (const slide of slides) {
      await Hero.findByIdAndUpdate(slide.id, { order: slide.order });
    }
    
    res.status(200).json({
      success: true,
      message: 'Hero slides reordered successfully'
    });
  } catch (error) {
    console.error('Reorder hero slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};