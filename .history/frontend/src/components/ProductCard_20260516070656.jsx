// ============================================
// src/components/ProductCard.jsx
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <Link to={`/product/${product._id}`} className="card group">
      <div className="relative overflow-hidden">
        <img
          src={product.mainImage?.url || 'https://via.placeholder.com/300'}
          alt={product.productName}
          className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
        />
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition"
        >
          <FiHeart className={`text-xl ${isInWishlist(product._id) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
        </button>
        {product.inventory?.currentStock <= 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.productName}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-indigo-600">${product.price}</span>
            {product.buyPrice && product.buyPrice < product.price && (
              <span className="text-gray-400 line-through ml-2">${product.buyPrice}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.inventory?.currentStock <= 0}
            className={`btn-primary py-1 px-3 text-sm ${product.inventory?.currentStock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FiShoppingCart className="inline mr-1" /> Add
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;