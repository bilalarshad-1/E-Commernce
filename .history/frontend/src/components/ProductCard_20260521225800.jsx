import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';

const ProductCard = ({ product, type = 'default' }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const handleWishlist = (e) => {
    e.preventDefault();
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  const discount = product.discount || 0;
  const originalPrice = product.price;
  const discountedPrice = originalPrice - (originalPrice * discount / 100);

  return (
    <Link to={`/product/${product._id}`} className="block group">
      <div className="card relative">
        {/* Badge */}
        {type === 'deal' && discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
            -{discount}% OFF
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
            Featured
          </div>
        )}
        {type === 'new' && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
            New
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md z-10 hover:scale-110 transition"
        >
          <FiHeart className={`${isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>

        {/* Image */}
        <div className="relative h-64 overflow-hidden bg-gray-100">
          <img
            src={product.mainImage?.url || 'https://via.placeholder.com/300'}
            alt={product.productName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.productName}</h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'fill-current' : ''}`} />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.totalReviews || 0})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            {discount > 0 ? (
              <>
                <span className="text-xl font-bold text-indigo-600">${discountedPrice.toFixed(2)}</span>
                <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xl font-bold text-indigo-600">${product.price?.toFixed(2)}</span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-indigo-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FiShoppingCart /> Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;