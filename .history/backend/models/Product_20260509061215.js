const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const variationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  buyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  }
});

const colorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    default: '#000000'
  },
  images: [{
    url: String,
    publicId: String,
    isMain: Boolean
  }]
});

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  buyPrice: {
    type: Number,
    required: [true, 'Buy price is required'],
    min: 0
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: 500
  },
  longDescription: {
    type: String,
    required: [true, 'Long description is required']
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  inventory: {
    currentStock: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    reservedStock: {
      type: Number,
      default: 0
    }
  },
  barcode: {
    number: {
      type: String,
      unique: true,
      sparse: true
    },
    imageUrl: String,
    format: {
      type: String,
      default: 'CODE128'
    }
  },
  qrCode: {
    data: String,
    imageUrl: String
  },
  hasVariations: {
    type: Boolean,
    default: false
  },
  variations: [variationSchema],
  hasColors: {
    type: Boolean,
    default: false
  },
  colors: [colorSchema],
  mainImage: {
    url: String,
    publicId: String
  },
  gallery: [{
    url: String,
    publicId: String,
    caption: String
  }],
  youtubeVideoUrl: {
    type: String,
    match: [
      /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
      'Please provide a valid YouTube URL'
    ]
  },
  youtubeVideoId: String,
  tags: [String],
  categories: [{
    type: String,
    trim: true
  }],
  brand: {
    type: String,
    trim: true
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'g', 'lb', 'oz'],
      default: 'kg'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total stock including variations
productSchema.virtual('totalStock').get(function() {
  if (this.hasVariations && this.variations.length > 0) {
    return this.variations.reduce((total, variation) => total + variation.stock, 0);
  }
  return this.inventory.currentStock;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.buyPrice > 0) {
    return ((this.price - this.buyPrice) / this.price) * 100;
  }
  return 0;
});

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('productName')) {
    this.slug = this.productName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-');
  }
  
  // Extract YouTube video ID
  if (this.isModified('youtubeVideoUrl') && this.youtubeVideoUrl) {
    const match = this.youtubeVideoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    this.youtubeVideoId = match ? match[1] : null;
  }
  
  next();
});

// Indexes for better query performance
productSchema.index({ price: 1, createdAt: -1 });
productSchema.index({ 'variations.sku': 1 });
productSchema.index({ status: 1, isPublished: 1 });
productSchema.index({ tags: 1, categories: 1 });

productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);