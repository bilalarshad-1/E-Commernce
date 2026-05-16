// ============================================
// src/pages/ProductDetailPage.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { FiHeart, FiShoppingCart, FiMinus, FiPlus, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      setProduct(response.data.data);
      setActiveImage(response.data.data.mainImage?.url || 'https://via.placeholder.com/500');
      if (response.data.data.variations?.length > 0) {
        setSelectedVariation(response.data.data.variations[0]);
      }
      if (response.data.data.colors?.length > 0) {
        setSelectedColor(response.data.data.colors[0]);
      }
    } catch (error) {
      console.error('Fetch product error:', error);
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (selectedVariation?.stock || product?.inventory?.currentStock || 10)) {
      setQuantity(newQuantity);
    }
  };

  const getCurrentPrice = () => {
    if (selectedVariation) return selectedVariation.price;
    return product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariation) return selectedVariation.stock;
    return product?.inventory?.currentStock || 0;
  };

  const handleAddToCart = () => {
    if (getCurrentStock() <= 0) {
      toast.error('Out of stock');
      return;
    }
    addToCart(product, quantity, selectedVariation);
    setQuantity(1);
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="mb-4">
            <img src={activeImage} alt={product.productName} className="w-full rounded-lg shadow-md" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {product.mainImage && (
              <img
                src={product.mainImage.url}
                alt="Main"
                onClick={() => setActiveImage(product.mainImage.url)}
                className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${activeImage === product.mainImage.url ? 'border-indigo-600' : 'border-transparent'}`}
              />
            )}
            {product.gallery?.map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                alt={`Gallery ${idx + 1}`}
                onClick={() => setActiveImage(img.url)}
                className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${activeImage === img.url ? 'border-indigo-600' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.productName}</h1>
          
          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className={`${i < Math.floor(product.rating) ? 'fill-current' : ''}`} />
              ))}
            </div>
            <span className="text-gray-600 ml-2">({product.totalReviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <span className="text-3xl font-bold text-indigo-600">${getCurrentPrice()}</span>
            {product.buyPrice && product.buyPrice < product.price && (
              <span className="text-gray-400 line-through ml-2">${product.buyPrice}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6">{product.longDescription}</p>

          {/* Variations */}
          {product.hasVariations && product.variations?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Variations</h3>
              <div className="flex flex-wrap gap-2">
                {product.variations.map(variation => (
                  <button
                    key={variation._id}
                    onClick={() => setSelectedVariation(variation)}
                    className={`px-4 py-2 border rounded-md transition ${selectedVariation?._id === variation._id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-300 hover:border-indigo-600'}`}
                  >
                    {variation.name} - ${variation.price}
                    {variation.stock <= 0 && <span className="text-red-500 text-sm ml-1">(Out of Stock)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.hasColors && product.colors?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Colors</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full border-2 ${selectedColor?.name === color.name ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2' : 'border-gray-300'}`}
                    style={{ backgroundColor: color.code }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Quantity</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-10 h-10 border rounded-md flex items-center justify-center hover:bg-gray-100"
              >
                <FiMinus />
              </button>
              <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-10 h-10 border rounded-md flex items-center justify-center hover:bg-gray-100"
              >
                <FiPlus />
              </button>
              <span className="text-gray-600">Stock: {getCurrentStock()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={getCurrentStock() <= 0}
              className={`flex-1 btn-primary py-3 ${getCurrentStock() <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiShoppingCart className="inline mr-2" /> Add to Cart
            </button>
            <button
              onClick={handleWishlistToggle}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
            >
              <FiHeart className={`text-xl ${isInWishlist(product._id) ? 'text-red-500 fill-red-500' : ''}`} />
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t">
            <div className="space-y-2 text-sm text-gray-600">
              {product.sku && <p>SKU: {product.sku}</p>}
              {product.categories?.length > 0 && (
                <p>Categories: {product.categories.map(c => c.name).join(', ')}</p>
              )}
              {product.tags?.length > 0 && (
                <p>Tags: {product.tags.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;