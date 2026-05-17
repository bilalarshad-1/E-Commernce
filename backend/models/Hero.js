const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Subtitle cannot exceed 200 characters']
  },
  buttonText: {
    type: String,
    default: 'Shop Now',
    trim: true
  },
  buttonUrl: {
    type: String,
    default: '/shop',
    trim: true
  },
  bgImage: {
    url: {
      type: String,
      required: [true, 'Background image is required']
    },
    publicId: {
      type: String,
      required: true
    }
  },
  order: {
    type: Number,
    default: 0,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure order is unique
heroSchema.index({ order: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Hero', heroSchema);