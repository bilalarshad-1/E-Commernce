const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const variationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  buyPrice: { type: Number, required: true, min: 0 },
  sku: { type: String, unique: true, sparse: true }
});

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: '#000000' },
  sku: { type: String, unique: true, sparse: true },
  images: [{ 
    url: String, 
    publicId: String, 
    isMain: { type: Boolean, default: false },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' }
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
  
  // Variations
  hasVariations: { type: Boolean, default: false },
  variations: [variationSchema],
  
  // Colors
  hasColors: { type: Boolean, default: false },
  colors: [colorSchema],
  
  // Images - Comprehensive Image Handling
  mainImage: { 
    url: String, 
    publicId: String, 
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
    width: Number,
    height: Number,
    format: String,
    size: Number
  },
  gallery: [{ 
    url: String, 
    publicId: String, 
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
    isMain: { type: Boolean, default: false },
    width: Number,
    height: Number,
    format: String,
    size: Number,
    order: { type: Number, default: 0 }
  }],
  
  // Additional Images for different purposes
  thumbnailImage: {
    url: String,
    publicId: String,
    alt: { type: String, default: '' }
  },
  hoverImage: {
    url: String,
    publicId: String,
    alt: { type: String, default: '' }
  },
  
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
  weight: { value: Number, unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' } },
  dimensions: { 
    length: Number, 
    width: Number, 
    height: Number, 
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' } 
  },
  
  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    twitterCard: String,
    twitterTitle: String,
    twitterDescription: String,
    twitterImage: String,
    canonicalUrl: String
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

// All images combined (for easy access)
productSchema.virtual('allImages').get(function() {
  const images = [];
  if (this.mainImage && this.mainImage.url) images.push(this.mainImage);
  if (this.gallery && this.gallery.length) images.push(...this.gallery);
  if (this.thumbnailImage && this.thumbnailImage.url) images.push(this.thumbnailImage);
  if (this.hoverImage && this.hoverImage.url) images.push(this.hoverImage);
  return images;
});

// Main gallery images (excluding mainImage)
productSchema.virtual('galleryImages').get(function() {
  return this.gallery || [];
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
  
  next();
});

// ========== METHODS ==========

// Update rating when new review is added
productSchema.methods.updateRating = async function(newRating) {
  const totalRatingSum = (this.rating * this.totalReviews) + newRating;
  this.totalReviews += 1;
  this.rating = totalRatingSum / this.totalReviews;
  
  // Update rating distribution
  const starLevel = Math.floor(newRating);
  if (starLevel >= 1 && starLevel <= 5) {
    this.ratingDistribution[starLevel] = (this.ratingDistribution[starLevel] || 0) + 1;
  }
  
  // Auto-update top rated flag
  this.isTopRated = this.rating >= 4.5;
  
  await this.save();
  return this;
};

// Get product URL
productSchema.methods.getProductUrl = function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/products/${this.slug || this._id}`;
};

// Reorder gallery images
productSchema.methods.reorderGallery = async function(imageOrders) {
  for (const order of imageOrders) {
    const image = this.gallery.id(order.imageId);
    if (image) {
      image.order = order.order;
    }
  }
  await this.save();
  return this;
};

// Set main gallery image
productSchema.methods.setMainGalleryImage = async function(imageId) {
  this.gallery.forEach(img => {
    img.isMain = img._id.toString() === imageId;
  });
  await this.save();
  return this;
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
productSchema.index({ productName: 'text', shortDescription: 'text', longDescription: 'text', tags: 'text' });

// ========== PLUGINS ==========
productSchema.plugin(mongoosePaginate);

// ========== EXPORT ==========
module.exports = mongoose.model('Product', productSchema);