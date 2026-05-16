// ============================================
// src/pages/WishlistPage.jsx (continued/complete)
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success('Added to cart');
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <FiHeart className="text-6xl text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
        <p className="text-gray-600 mb-6">Save your favorite items here for easy access.</p>
        <Link to="/shop" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist ({wishlistItems.length})</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlistItems.map(product => (
          <div key={product._id} className="card group">
            <div className="relative overflow-hidden">
              <Link to={`/product/${product._id}`}>
                <img
                  src={product.mainImage?.url || 'https://via.placeholder.com/300'}
                  alt={product.productName}
                  className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
                />
              </Link>
              <button
                onClick={() => removeFromWishlist(product._id)}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition"
              >
                <FiTrash2 className="text-xl text-red-500" />
              </button>
              {product.inventory?.currentStock <= 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">Out of Stock</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <Link to={`/product/${product._id}`}>
                <h3 className="font-semibold text-lg mb-2 line-clamp-1 hover:text-indigo-600">
                  {product.productName}
                </h3>
              </Link>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-indigo-600">${product.price}</span>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.inventory?.currentStock <= 0}
                  className={`btn-primary py-1 px-3 text-sm ${product.inventory?.currentStock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiShoppingCart className="inline mr-1" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;