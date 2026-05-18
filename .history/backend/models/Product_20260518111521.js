// models/Product.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const variationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  buyPrice: { type: Number, required: true, min: 0 },
  sku: { type: String, unique: true, sparse: true },
  barcode: {
    number: { type: String, sparse: true }
  },
  qrCode: {
    data: { type: String }
  }
});

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: '#000000' },
  sku: { type: String, unique: true, sparse: true },
  barcode: {
    number: { type: String, sparse: true }
  },
  qrCode: {
    data: { type: String }
  },
  images: [{ 
    url: String, 
    publicId: String, 
    isMain: { type: Boolean, default: false }
  }]
});

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true, trim: true, index: true },
  slug: { type: String, unique: true, lowercase: true },
  price: { type: Number, required: true, min: 0 },
  buyPrice: { type: Number, required: true, min: 0 },
  shortDescription: { type: String, required: true, maxlength: 500 },
  longDescription: { type: String, required: true },
  
  // Rating system
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  ratingDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  },
  
  // Barcode & QR Code for main product
  barcode: {
    number: { type: String, unique: true, sparse: true },
    format: { type: String, default: 'CODE128' }
  },
  qrCode: {
    data: { type: String }
  },
  
  // Variations
  hasVariations: { type: Boolean, default: false },
  variations: [variationSchema],
  
  // Colors
  hasColors: { type: Boolean, default: false },
  colors: [colorSchema],
  
  // Images
  mainImage: { 
    url: String, 
    publicId: String,
    alt: String,
    caption: String
  },
  gallery: [{ 
    url: String, 
    publicId: String, 
    caption: String,
    isMain: { type: Boolean, default: false }
  }],
  
  // Media
  youtubeVideoUrl: { type: String },
  youtubeVideoId: String,
  
  // Classification
  tags: [String],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  categoryNames: [String],
  primaryCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: String, trim: true },
  
  // Flags
  isFeatured: { type: Boolean, default: false },
  isHotSale: { type: Boolean, default: false },
  isTopRated: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  
  // Dimensions & Weight
  weight: { 
    value: Number, 
    unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' } 
  },
  dimensions: { 
    length: Number, 
    width: Number, 
    height: Number, 
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' } 
  },
  
  // Status
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' },
  publishedAt: Date,
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views: { type: Number, default: 0 },
  sales: { type: Number, default: 0 }
  
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ========== VIRTUALS ==========

// Profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.buyPrice > 0) {
    return ((this.price - this.buyPrice) / this.price) * 100;
  }
  return 0;
});

// Update top rated flag based on rating
productSchema.virtual('updateTopRatedFlag').set(function(rating) {
  this.isTopRated = rating >= 4.5;
});

// ========== PRE-SAVE MIDDLEWARE ==========
productSchema.pre('save', async function(next) {
  
  // 1. Generate slug from product name
  if (this.isModified('productName')) {
    this.slug = this.productName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-');
  }
  
  // 2. Extract YouTube video ID
  if (this.isModified('youtubeVideoUrl') && this.youtubeVideoUrl) {
    const match = this.youtubeVideoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^?&/]+)/
    );
    this.youtubeVideoId = match ? match[1] : null;
  }
  
  // 3. Update category names when categories change
  if (this.isModified('categories') && this.categories.length > 0) {
    const Category = mongoose.model('Category');
    const categories = await Category.find({ _id: { $in: this.categories } });
    this.categoryNames = categories.map(cat => cat.name.toLowerCase());
  }
  
  // 4. Auto-update top rated flag based on rating
  if (this.isModified('rating')) {
    this.isTopRated = this.rating >= 4.5;
  }
  
  // 5. Set publishedAt when publishing
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // 6. Handle QR code data for main product
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  if (typeof this.qrCode === 'string') {
    try {
      this.qrCode = JSON.parse(this.qrCode);
    } catch (err) {
      this.qrCode = {};
    }
  }
  
  if (!this.qrCode || typeof this.qrCode !== 'object') {
    this.qrCode = {};
  }
  
  if (!this.qrCode.data) {
    this.qrCode.data = `${baseUrl}/products/${this._id}`;
  }
  
  // 7. Generate barcode number for main product if missing
  if (!this.barcode || !this.barcode.number) {
    const prefix = process.env.BARCODE_PREFIX || 'PROD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.barcode = {
      number: `${prefix}${timestamp}${random}`,
      format: 'CODE128'
    };
  }
  
  // 8. Generate QR data and barcode numbers for variations
  if (this.hasVariations && this.variations.length > 0) {
    for (let i = 0; i < this.variations.length; i++) {
      const variation = this.variations[i];
      
      if (!variation.barcode || !variation.barcode.number) {
        const prefix = 'VAR';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        variation.barcode = {
          number: `${prefix}${timestamp}${random}`
        };
      }
      
      if (!variation.qrCode || !variation.qrCode.data) {
        variation.qrCode = {
          data: `${baseUrl}/products/${this._id}/variation/${variation._id || i}`
        };
      }
    }
  }
  
  // 9. Generate QR data and barcode numbers for colors
  if (this.hasColors && this.colors.length > 0) {
    for (let i = 0; i < this.colors.length; i++) {
      const color = this.colors[i];
      
      if (!color.barcode || !color.barcode.number) {
        const prefix = 'CLR';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        color.barcode = {
          number: `${prefix}${timestamp}${random}`
        };
      }
      
      if (!color.qrCode || !color.qrCode.data) {
        color.qrCode = {
          data: `${baseUrl}/products/${this._id}/color/${color._id || i}`
        };
      }
    }
  }
  
  next();
});

// ========== METHODS ==========

// Update rating when new review is added
productSchema.methods.updateRating = async function(newRating) {
  const totalRatingSum = (this.rating * this.totalReviews) + newRating;
  this.totalReviews += 1;
  this.rating = totalRatingSum / this.totalReviews;
  
  const starLevel = Math.floor(newRating);
  if (starLevel >= 1 && starLevel <= 5) {
    this.ratingDistribution[starLevel] = (this.ratingDistribution[starLevel] || 0) + 1;
  }
  
  this.isTopRated = this.rating >= 4.5;
  
  await this.save();
  return this;
};

// Get product URL for QR code
productSchema.methods.getProductUrl = function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/products/${this.slug || this._id}`;
};

// ========== STATIC METHODS ==========

// Get featured products
productSchema.statics.getFeaturedProducts = function(limit = 10) {
  return this.find({ isFeatured: true, isPublished: true, status: 'active' })
    .limit(limit)
    .sort('-createdAt');
};

// Get hot sale products
productSchema.statics.getHotSaleProducts = function(limit = 10) {
  return this.find({ isHotSale: true, isPublished: true, status: 'active' })
    .limit(limit)
    .sort('-sales');
};

// Get top rated products
productSchema.statics.getTopRatedProducts = function(limit = 10) {
  return this.find({ isTopRated: true, isPublished: true, status: 'active' })
    .limit(limit)
    .sort('-rating');
};

// ========== INDEXES ==========
productSchema.index({ price: 1, createdAt: -1 });
productSchema.index({ status: 1, isPublished: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ categories: 1, primaryCategory: 1 });
productSchema.index({ categoryNames: 1 });
productSchema.index({ isFeatured: 1, isHotSale: 1, isTopRated: 1 });
productSchema.index({ rating: -1, totalReviews: -1 });
productSchema.index({ sales: -1 });
productSchema.index({ 'variations.sku': 1 });
productSchema.index({ 'colors.sku': 1 });
productSchema.index({ 'barcode.number': 1 });
productSchema.index({ productName: 'text', shortDescription: 'text', longDescription: 'text', tags: 'text' });

// ========== PLUGINS ==========
productSchema.plugin(mongoosePaginate);

// ========== EXPORT ==========
module.exports = mongoose.model('Product', productSchema);