// components/common/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye, FiStar } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import QuickViewModal from '../modals/QuickViewModal';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const inWishlist = isInWishlist(product._id);
  const discount = product.originalPrice ? 
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

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
    addToCart(product, 1);
  };

  return (
    <>
      <motion.div
        className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -5 }}
      >
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
              New
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all"
        >
          <FiHeart
            className={`h-4 w-4 transition-colors ${
              inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
          />
        </button>

        {/* Product Image */}
        <Link to={`/product/${product._id}`}>
          <div className="relative h-64 overflow-hidden bg-gray-100">
            <img
              src={product.mainImage?.url || '/images/placeholder.jpg'}
              alt={product.productName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Overlay Actions */}
            <div
              className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                onClick={handleAddToCart}
                className="bg-white text-gray-900 p-2 rounded-full hover:bg-primary-600 hover:text-white transition-colors"
              >
                <FiShoppingCart className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowQuickView(true)}
                className="bg-white text-gray-900 p-2 rounded-full hover:bg-primary-600 hover:text-white transition-colors"
              >
                <FiEye className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-4">
          <Link to={`/product/${product._id}`}>
            <h3 className="font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors line-clamp-1">
              {product.productName}
            </h3>
          </Link>
          
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
            {product.shortDescription}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.totalReviews || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary-600">
              ${product.price?.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.inventory?.currentStock <= 10 && product.inventory?.currentStock > 0 && (
            <p className="text-xs text-yellow-600 mt-1">Only {product.inventory.currentStock} left</p>
          )}
          {product.inventory?.currentStock === 0 && (
            <p className="text-xs text-red-600 mt-1">Out of Stock</p>
          )}
        </div>
      </motion.div>

      <QuickViewModal
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        product={product}
      />
    </>
  );
};

export default ProductCard;