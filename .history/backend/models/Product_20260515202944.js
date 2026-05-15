// models/Product.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const variationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  buyPrice: { type: Number, required: true, min: 0 },
  sku: { type: String, unique: true, sparse: true },
  stock: { type: Number, default: 0, min: 0 }
});

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: '#000000' },
  images: [{ url: String, publicId: String, isMain: Boolean }]
});

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true, trim: true, index: true },
  slug: { type: String, unique: true, lowercase: true },
  price: { type: Number, required: true, min: 0 },
  buyPrice: { type: Number, required: true, min: 0 },
  shortDescription: { type: String, required: true, maxlength: 500 },
  longDescription: { type: String, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  inventory: {
    currentStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    reservedStock: { type: Number, default: 0 }
  },
  barcode: {
    number: { type: String, unique: true, sparse: true },
    format: { type: String, default: 'CODE128' }
    // NO imageUrl - image generated on demand
  },
  qrCode: {
    data: { type: String }
    // NO imageUrl - image generated on demand
  },
  hasVariations: { type: Boolean, default: false },
  variations: [variationSchema],
  hasColors: { type: Boolean, default: false },
  colors: [colorSchema],
  mainImage: { url: String, publicId: String },
  gallery: [{ url: String, publicId: String, caption: String }],
  youtubeVideoUrl: { type: String },
  youtubeVideoId: String,
  tags: [String],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  categoryNames: [String],
  primaryCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: String, trim: true },
  weight: { value: Number, unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' } },
  dimensions: { length: Number, width: Number, height: Number, unit: { type: String, enum: ['cm', 'in'], default: 'cm' } },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' },
  isFeatured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views: { type: Number, default: 0 },
  sales: { type: Number, default: 0 }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('totalStock').get(function() {
  if (this.hasVariations && this.variations.length > 0) {
    return this.variations.reduce((total, variation) => total + variation.stock, 0);
  }
  return this.inventory.currentStock;
});

productSchema.virtual('profitMargin').get(function() {
  if (this.buyPrice > 0) {
    return ((this.price - this.buyPrice) / this.price) * 100;
  }
  return 0;
});

productSchema.pre('save', async function(next) {
  if (this.isModified('productName')) {
    this.slug = this.productName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
  }
  
  if (this.isModified('youtubeVideoUrl') && this.youtubeVideoUrl) {
    const match = this.youtubeVideoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    this.youtubeVideoId = match ? match[1] : null;
  }
  
  if (this.isModified('categories') && this.categories.length > 0) {
    const Category = mongoose.model('Category');
    const categories = await Category.find({ _id: { $in: this.categories } });
    this.categoryNames = categories.map(cat => cat.name.toLowerCase());
  }
  
  // Generate QR data if not present
  if (!this.qrCode.data && this._id) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.qrCode.data = `${baseUrl}/products/${this._id}`;
  }
  
  next();
});

productSchema.index({ price: 1, createdAt: -1 });
productSchema.index({ 'variations.sku': 1 });
productSchema.index({ status: 1, isPublished: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ categories: 1, primaryCategory: 1 });
productSchema.index({ categoryNames: 1 });
productSchema.index({ productName: 'text', shortDescription: 'text', 'barcode.number': 'text' });

productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);