import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPackage, FiDollarSign,
  FiGrid, FiStar, FiBarChart2, FiEye, FiTag, FiCalendar,
  FiVideo, FiFolder, FiShare2, FiHeart, FiTrendingUp, 
  FiAward, FiUser, FiShoppingCart, FiPlus, FiMinus, 
  FiZoomIn, FiZoomOut, FiImage, FiCheck, FiCopy,
  FiExternalLink, FiClock, FiInfo, FiGrid as FiGalleryGrid
} from 'react-icons/fi';
import { format } from 'date-fns';
import DeleteModal from './DeleteModal';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [colorImages, setColorImages] = useState([]);
  const [selectedColorImage, setSelectedColorImage] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productService.getProduct(id);
      const productData = response.data.data;
      setProduct(productData);
      
      if (productData.variations?.length > 0) {
        setSelectedVariation(productData.variations[0]);
      }
      if (productData.colors?.length > 0) {
        setSelectedColor(productData.colors[0]);
        // Load color images for selected color
        if (productData.colors[0].images?.length > 0) {
          setColorImages(productData.colors[0].images);
          setSelectedColorImage(productData.colors[0].images[0]);
        }
      }
    } catch (error) {
      console.error('Fetch product error:', error);
      toast.error('Failed to fetch product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    if (color.images?.length > 0) {
      setColorImages(color.images);
      setSelectedColorImage(color.images[0]);
      setActiveImage(0);
    } else {
      setColorImages([]);
      setSelectedColorImage(null);
    }
  };

  const handleCopyProductUrl = () => {
    const url = `${window.location.origin}/product/${product.slug || product._id}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success('Product URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getCurrentPrice = () => {
    if (selectedVariation) return selectedVariation.price;
    return product?.price || 0;
  };

  const getCurrentBuyPrice = () => {
    if (selectedVariation) return selectedVariation.buyPrice;
    return product?.buyPrice || 0;
  };

  const getProfitMargin = () => {
    const price = getCurrentPrice();
    const buyPrice = getCurrentBuyPrice();
    if (price && buyPrice && price > 0) {
      return (((price - buyPrice) / price) * 100).toFixed(1);
    }
    return 0;
  };

  const getAllImages = () => {
    const images = [];
    
    // Add main image from selected color if available
    if (selectedColor && selectedColor.images?.length > 0) {
      images.push(...selectedColor.images);
    }
    
    // Add product main image if no color images
    if (images.length === 0 && product?.mainImage?.url) {
      images.push(product.mainImage);
    }
    
    // Add gallery images
    if (product?.gallery?.length > 0 && images.length === 0) {
      images.push(...product.gallery);
    }
    
    return images.filter(img => img && img.url);
  };

  const allImages = getAllImages();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
        <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          <FiArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const profitMargin = getProfitMargin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Link to="/products" className="text-gray-600 hover:text-gray-900 transition-colors">
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-600 text-sm">ID: {product._id?.slice(-8)}</p>
              {product.slug && (
                <p className="text-gray-400 text-sm">Slug: {product.slug}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleCopyProductUrl}
            className="btn-secondary flex items-center gap-2 transition-all hover:scale-105"
          >
            {copiedUrl ? <FiCheck className="h-4 w-4" /> : <FiShare2 className="h-4 w-4" />}
            Share
          </button>
          <button
            onClick={() => navigate(`/products/edit/${id}`)}
            className="btn-primary flex items-center gap-2 transition-all hover:scale-105"
          >
            <FiEdit2 className="h-4 w-4" />
            Edit Product
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-all hover:scale-105"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-6">
            <div className="space-y-4">
              {/* Main Image */}
              <div 
                className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden cursor-zoom-in relative group"
                onClick={() => setIsZoomed(!isZoomed)}
              >
                {allImages[activeImage]?.url ? (
                  <>
                    <img
                      src={allImages[activeImage].url}
                      alt={allImages[activeImage].alt || product.productName}
                      className={`w-full h-full object-cover transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isZoomed ? <FiZoomOut className="h-4 w-4 text-white" /> : <FiZoomIn className="h-4 w-4 text-white" />}
                    </div>
                    {allImages[activeImage].caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 text-center">
                        {allImages[activeImage].caption}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FiPackage className="h-16 w-16 text-gray-400" />
                    <p className="text-gray-400 text-sm mt-2">No image available</p>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div>
                  <div className="grid grid-cols-5 gap-2">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === index ? 'border-primary-600 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.isMain && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-xs text-center py-0.5">
                            Main
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    {allImages.length} image{allImages.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product Flags */}
          {(product.isFeatured || product.isHotSale || product.isTopRated) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiAward className="h-5 w-5 text-primary-600" />
                Product Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm">
                    <FiStar className="h-3.5 w-3.5" /> Featured
                  </span>
                )}
                {product.isHotSale && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
                    <FiTrendingUp className="h-3.5 w-3.5" /> Hot Sale
                  </span>
                )}
                {product.isTopRated && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                    <FiAward className="h-3.5 w-3.5" /> Top Rated
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Thumbnail & Hover Images Info */}
          {(product.thumbnailImage || product.hoverImage) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiImage className="h-5 w-5 text-primary-600" />
                Additional Images
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {product.thumbnailImage && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Thumbnail Image</p>
                    <img 
                      src={product.thumbnailImage.url} 
                      alt="Thumbnail"
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {product.hoverImage && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hover Image</p>
                    <img 
                      src={product.hoverImage.url} 
                      alt="Hover"
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Quick Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <p className="font-semibold mt-1">
                  {product.isPublished ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <FiEye className="h-3 w-3" /> Published
                    </span>
                  ) : (
                    <span className="text-gray-600 flex items-center gap-1">
                      <FiEye className="h-3 w-3" /> Draft
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Product Status</p>
                <p className="font-semibold mt-1 capitalize">
                  {product.status === 'active' ? (
                    <span className="text-green-600">Active</span>
                  ) : product.status === 'inactive' ? (
                    <span className="text-red-600">Inactive</span>
                  ) : (
                    <span className="text-yellow-600">Draft</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Rating</p>
                <p className="font-semibold mt-1 flex items-center gap-1">
                  <span className="text-gray-900">{product.rating?.toFixed(1) || 0}</span>
                  <FiStar className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                  <span className="text-gray-400 text-xs">({product.totalReviews || 0})</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Profit Margin</p>
                <p className="font-semibold mt-1">
                  {profitMargin > 0 ? (
                    <span className="text-green-600">{profitMargin}%</span>
                  ) : (
                    <span className="text-red-600">{profitMargin}%</span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-1">
              {[
                { id: 'details', label: 'Product Details', icon: FiPackage },
                { id: 'pricing', label: 'Pricing & Options', icon: FiDollarSign },
                { id: 'specs', label: 'Specifications', icon: FiInfo },
                { id: 'media', label: 'Media', icon: FiImage }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Short Description */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 italic">"{product.shortDescription}"</p>
                </div>

                {/* Long Description */}
                <div className="bg-white rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Full Description</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {product.longDescription}
                    </p>
                  </div>
                </div>

                {/* Categories & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.categories && product.categories.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FiFolder className="h-4 w-4 text-primary-600" />
                        Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {product.categories.map((category, index) => {
                          const categoryName = typeof category === 'object' ? category.name : category;
                          const categorySlug = typeof category === 'object' ? category.slug : category;
                          return (
                            <Link
                              key={index}
                              to={`/categories/${categorySlug || category}`}
                              className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
                            >
                              {categoryName}
                            </Link>
                          );
                        })}
                      </div>
                      {product.primaryCategory && (
                        <p className="text-xs text-gray-500 mt-2">
                          Primary: {typeof product.primaryCategory === 'object' ? product.primaryCategory.name : product.primaryCategory}
                        </p>
                      )}
                    </div>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FiTag className="h-4 w-4 text-primary-600" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Brand */}
                {product.brand && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Brand</h3>
                    <p className="text-gray-700">{product.brand}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Pricing & Options Tab */}
            {activeTab === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Pricing Info */}
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Current Price</p>
                    <p className="text-4xl font-bold text-primary-600">${currentPrice.toFixed(2)}</p>
                    {product.buyPrice && (
                      <p className="text-sm text-gray-500 mt-2">
                        Cost: ${product.buyPrice.toFixed(2)} | 
                        Profit: ${(currentPrice - product.buyPrice).toFixed(2)} per unit
                      </p>
                    )}
                  </div>
                </div>

                {/* Variations */}
                {product.hasVariations && product.variations?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiBarChart2 className="h-5 w-5" />
                      Product Variations
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Variation</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Cost</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {product.variations.map((variation, index) => (
                            <tr 
                              key={index}
                              className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                selectedVariation?._id === variation._id ? 'bg-primary-50' : ''
                              }`}
                              onClick={() => setSelectedVariation(variation)}
                            >
                              <td className="px-4 py-3 text-sm font-medium">{variation.name}</td>
                              <td className="px-4 py-3 text-sm">${variation.price}</td>
                              <td className="px-4 py-3 text-sm">${variation.buyPrice || '-'}</td>
                              <td className="px-4 py-3 text-sm font-mono">{variation.sku || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {selectedVariation && (
                      <p className="text-xs text-primary-600 mt-2 text-center">
                        Selected: {selectedVariation.name} - ${selectedVariation.price}
                      </p>
                    )}
                  </div>
                )}

                {/* Colors */}
                {product.hasColors && product.colors?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
                      Color Variants
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {product.colors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => handleColorSelect(color)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            selectedColor?._id === color._id
                              ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full border-2 shadow-sm"
                            style={{ backgroundColor: color.code }}
                          />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{color.name}</p>
                            {color.sku && <p className="text-xs text-gray-500 font-mono">{color.sku}</p>}
                          </div>
                          {color.images?.length > 0 && (
                            <FiImage className="h-3 w-3 text-gray-400 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* Color Images Preview */}
                    {selectedColor && selectedColor.images?.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Images for {selectedColor.name} ({selectedColor.images.length})
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {selectedColor.images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedColorImage(img);
                                setActiveImage(0);
                              }}
                              className="flex-shrink-0"
                            >
                              <img
                                src={img.url}
                                alt={img.alt || `${selectedColor.name} ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border-2 hover:border-primary-500 transition-all"
                              />
                              {img.isMain && (
                                <span className="text-xs text-primary-600 block text-center">Main</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity Selector (Admin View - for reference) */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Quantity Information</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                        <FiMinus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg"
                        min="1"
                      />
                      <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                        <FiPlus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">This is for reference only</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specs' && (
              <motion.div
                key="specs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weight */}
                  {product.weight?.value && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {product.weight.value} {product.weight.unit}
                      </p>
                    </div>
                  )}

                  {/* Dimensions */}
                  {product.dimensions?.length && product.dimensions?.width && product.dimensions?.height && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Dimensions</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensions.unit}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(product.createdAt), 'MMMM dd, yyyy h:mm a')}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(product.updatedAt), 'MMMM dd, yyyy h:mm a')}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{product.views || 0}</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">{product.sales || 0}</p>
                  </div>
                </div>

                {/* Created By Info */}
                {(product.createdBy || product.updatedBy) && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-6 text-sm">
                      {product.createdBy && (
                        <div className="flex items-center gap-2">
                          <FiUser className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Created by:</span>
                          <span className="font-medium">
                            {typeof product.createdBy === 'object' ? product.createdBy.name : product.createdBy}
                          </span>
                        </div>
                      )}
                      {product.updatedBy && (
                        <div className="flex items-center gap-2">
                          <FiClock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Last edited by:</span>
                          <span className="font-medium">
                            {typeof product.updatedBy === 'object' ? product.updatedBy.name : product.updatedBy}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <motion.div
                key="media"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* YouTube Video */}
                {product.youtubeVideoUrl && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiVideo className="h-5 w-5 text-red-600" />
                      Product Video
                    </h3>
                    <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                      <iframe
                        src={`https://www.youtube.com/embed/${product.youtubeVideoId}`}
                        title="Product Video"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* All Images Gallery */}
                {allImages.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiGalleryGrid className="h-5 w-5 text-primary-600" />
                      Complete Gallery ({allImages.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {allImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={image.alt || `Image ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => {
                              setActiveImage(index);
                              setActiveTab('details');
                            }}
                          />
                          {image.isMain && (
                            <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded">
                              Main
                            </span>
                          )}
                          {image.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-lg truncate">
                              {image.caption}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <FiZoomIn className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Media Message */}
                {!product.youtubeVideoUrl && allImages.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FiImage className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No media content available</p>
                    <p className="text-sm text-gray-400 mt-1">Add images or video to enhance the product page</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          await productService.deleteProduct(id);
          toast.success('Product deleted successfully');
          navigate('/products');
        }}
        productName={product.productName}
      />
    </div>
  );
};

export default ProductDetail;