// components/modals/QuickViewModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHeart, FiShoppingCart, FiMinus, FiPlus, FiStar } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Rating from '../common/Rating';

const QuickViewModal = ({ isOpen, onClose, product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return null;

  const inWishlist = isInWishlist(product._id);
  const allImages = [
    product.mainImage,
    ...(product.gallery || [])
  ].filter(img => img && img.url);

  const currentPrice = selectedVariation?.price || product.price;
  const currentStock = selectedVariation?.stock || product.inventory?.currentStock;

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    if (inWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product._id);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariation);
    onClose();
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= currentStock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
              >
                <FiX className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Images Section */}
                <div>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                    {allImages[selectedImage]?.url ? (
                      <img
                        src={allImages[selectedImage].url}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FiShoppingCart className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {allImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {allImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 ${
                            selectedImage === index ? 'border-primary-600' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`Thumbnail ${index}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div>
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.productName}
                  </h2>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <Rating rating={product.rating || 0} size="md" />
                    <span className="text-gray-500">({product.totalReviews || 0} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-primary-600">
                      ${currentPrice?.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-gray-400 line-through ml-2">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4">
                    {product.shortDescription}
                  </p>

                  {/* Variations */}
                  {product.hasVariations && product.variations?.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Variation
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {product.variations.map((variation) => (
                          <button
                            key={variation._id}
                            onClick={() => setSelectedVariation(variation)}
                            className={`p-2 border rounded-lg text-sm transition-colors ${
                              selectedVariation?._id === variation._id
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-gray-300 hover:border-primary-300'
                            }`}
                          >
                            {variation.name}
                            <span className="block text-xs text-gray-500">
                              ${variation.price}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiMinus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= currentStock}
                        className="p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiPlus className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-gray-500">
                        {currentStock} available
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={currentStock === 0}
                      className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <FiShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleWishlist}
                      className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiHeart
                        className={`h-5 w-5 ${
                          inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Additional Info */}
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">SKU:</span> {product.sku || 'N/A'}
                    </p>
                    {product.brand && (
                      <p className="text-gray-600">
                        <span className="font-medium">Brand:</span> {product.brand}
                      </p>
                    )}
                    {product.categories && product.categories.length > 0 && (
                      <p className="text-gray-600">
                        <span className="font-medium">Categories:</span>{' '}
                        {product.categories.map(c => typeof c === 'object' ? c.name : c).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;