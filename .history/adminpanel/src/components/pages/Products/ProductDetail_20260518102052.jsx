// pages/products/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPackage, FiDollarSign,
  FiGrid, FiStar, FiBarChart2, FiEye, FiTag, FiCalendar,
  FiVideo, FiRefreshCw, FiFolder, FiPrinter, FiDownload,
  FiCopy, FiCheck, FiShare2, FiExternalLink, FiHeart,
  FiTrendingUp, FiAward, FiClock, FiUser, FiMapPin,
  FiShoppingCart, FiPlus, FiMinus, FiZoomIn, FiZoomOut
} from 'react-icons/fi';
import { BiBarcode, BiQr } from 'react-icons/bi';
import { format } from 'date-fns';
import DeleteModal from '../../';
import StockModal from './StockModal';
import BarcodeModal from '../../components/products/BarcodeModal';
import QRCodeModal from '../../components/products/QRCodeModal';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [stockUpdate, setStockUpdate] = useState({ stock: 0, type: 'set', variationId: '' });
  const [activeImage, setActiveImage] = useState(0);
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productService.getProduct(id);
      setProduct(response.data.data);
      if (response.data.data.variations?.length > 0) {
        setSelectedVariation(response.data.data.variations[0]);
      }
      if (response.data.data.colors?.length > 0) {
        setSelectedColor(response.data.data.colors[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    try {
      await productService.updateStock(id, stockUpdate);
      toast.success('Stock updated successfully');
      setShowStockModal(false);
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleSaveBarcode = async (barcodeData) => {
    try {
      const formData = new FormData();
      formData.append('barcode', JSON.stringify(barcodeData));
      await productService.updateProduct(id, formData);
      toast.success('Barcode saved successfully');
      setShowBarcodeModal(false);
      fetchProduct();
    } catch (error) {
      toast.error('Failed to save barcode');
    }
  };

  const handleSaveQR = async (qrData) => {
    try {
      const formData = new FormData();
      formData.append('qrCode', JSON.stringify(qrData));
      await productService.updateProduct(id, formData);
      toast.success('QR code saved successfully');
      setShowQRModal(false);
      fetchProduct();
    } catch (error) {
      toast.error('Failed to save QR code');
    }
  };

  const handlePrintBarcode = () => {
    if (!product?.barcode?.number) {
      toast.error('No barcode available');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode - ${product.productName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
            .barcode-card { background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .barcode-number { font-size: 36px; letter-spacing: 4px; margin: 30px 0; font-weight: bold; }
            .product-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .price { font-size: 24px; font-weight: bold; color: #2563eb; margin: 10px 0; }
            @media print { body { background: white; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="barcode-card">
            <div class="product-name">${product.productName}</div>
            <div class="barcode-number">*${product.barcode.number}*</div>
            <div class="price">$${(product.price || 0).toFixed(2)}</div>
            <div class="no-print" style="margin-top: 30px;">
              <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Close</button>
            </div>
          </div>
          <script>window.print();setTimeout(()=>window.close(),500);</script>
        </body>
      </html>
    `);
  };

  const handlePrintQR = () => {
    const qrUrl = product?.qrCode?.imageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/product/${product._id}`)}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${product.productName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
            .qr-card { background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            img { max-width: 200px; margin: 20px auto; }
            .product-name { font-size: 20px; font-weight: bold; margin: 20px 0 10px; }
            @media print { body { background: white; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <img src="${qrUrl}" alt="QR Code" />
            <div class="product-name">${product.productName}</div>
            <div class="no-print" style="margin-top: 30px;">
              <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Close</button>
            </div>
          </div>
          <script>window.print();setTimeout(()=>window.close(),500);</script>
        </body>
      </html>
    `);
  };

  const handleCopyBarcode = () => {
    if (product?.barcode?.number) {
      navigator.clipboard.writeText(product.barcode.number);
      setCopiedBarcode(true);
      toast.success('Barcode copied to clipboard');
      setTimeout(() => setCopiedBarcode(false), 2000);
    }
  };

  const handleCopyProductUrl = () => {
    const url = `${window.location.origin}/product/${product._id}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success('Product URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getCurrentPrice = () => {
    if (selectedVariation) return selectedVariation.price;
    if (selectedColor) return product?.price;
    return product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariation) return selectedVariation.stock;
    if (selectedColor) return selectedColor.stock;
    if (product?.hasVariations) return product.variations?.reduce((sum, v) => sum + (v.stock || 0), 0);
    if (product?.hasColors) return product.colors?.reduce((sum, c) => sum + (c.stock || 0), 0);
    return product?.inventory?.currentStock || 0;
  };

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

  const allImages = [
    product.mainImage,
    ...(product.gallery || [])
  ].filter(img => img && img.url);

  const totalStock = getCurrentStock();
  const currentPrice = getCurrentPrice();
  const profitMargin = product.price && product.buyPrice
    ? (((product.price - product.buyPrice) / product.price) * 100).toFixed(1)
    : 0;

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
            <p className="text-gray-600 mt-1">SKU: {product._id?.slice(-8)}</p>
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
            onClick={() => setShowStockModal(true)}
            className="btn-secondary flex items-center gap-2 transition-all hover:scale-105"
          >
            <FiRefreshCw className="h-4 w-4" />
            Update Stock
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="space-y-4">
              <div 
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in relative group"
                onClick={() => setIsZoomed(!isZoomed)}
              >
                {allImages[activeImage]?.url ? (
                  <>
                    <img
                      src={allImages[activeImage].url}
                      alt={product.productName}
                      className={`w-full h-full object-cover transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isZoomed ? <FiZoomOut className="h-4 w-4 text-white" /> : <FiZoomIn className="h-4 w-4 text-white" />}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FiPackage className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        activeImage === index ? 'border-primary-600 scale-105' : 'border-transparent hover:scale-105'
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
          </div>

          {/* Barcode & QR Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BiBarcode className="h-5 w-5" />
              Barcode & QR Code
            </h3>
            
            {product.barcode?.number && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Barcode</span>
                  <div className="flex gap-2">
                    <button onClick={handleCopyBarcode} className="text-primary-600 hover:text-primary-700 transition-colors">
                      {copiedBarcode ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                    </button>
                    <button onClick={handlePrintBarcode} className="text-primary-600 hover:text-primary-700 transition-colors">
                      <FiPrinter className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="font-mono text-lg tracking-wider text-center">
                  {product.barcode.number}
                </div>
                <img 
                  src={`https://barcode.tec-it.com/barcode.ashx?data=${product.barcode.number}&code=Code128&dpi=96`}
                  alt="Barcode"
                  className="mx-auto mt-2"
                />
              </div>
            )}

            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/product/${product._id}`)}`}
                alt="QR Code"
                className="w-24 h-24 mx-auto mb-2"
              />
              <div className="flex gap-2 justify-center">
                <button onClick={handlePrintQR} className="text-primary-600 hover:text-primary-700 text-sm transition-colors">
                  <FiPrinter className="h-4 w-4 inline mr-1" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Product Flags */}
          {(product.isFeatured || product.isHotSale || product.isTopRated) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Product Badges</h3>
              <div className="flex flex-wrap gap-2">
                {product.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                    <FiStar className="h-3 w-3" /> Featured
                  </span>
                )}
                {product.isHotSale && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    <FiTrendingUp className="h-3 w-3" /> Hot Sale
                  </span>
                )}
                {product.isTopRated && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    <FiAward className="h-3 w-3" /> Top Rated
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Pricing */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold mt-1">
                  {product.isPublished ? (
                    <span className="text-green-600">Published</span>
                  ) : (
                    <span className="text-gray-600">Draft</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Product Status</p>
                <p className="font-semibold mt-1 capitalize">{product.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock</p>
                <p className="font-semibold mt-1">
                  {totalStock > 0 ? (
                    totalStock <= (product.inventory?.lowStockThreshold || 10) ? (
                      <span className="text-yellow-600">{totalStock} units (Low Stock)</span>
                    ) : (
                      <span className="text-green-600">{totalStock} units</span>
                    )
                  ) : (
                    <span className="text-red-600">Out of Stock</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="font-semibold mt-1 text-green-600">{profitMargin}%</p>
              </div>
            </div>
          </motion.div>

          {/* Pricing and Variant Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiDollarSign className="h-5 w-5" />
              Pricing & Options
            </h3>
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary-600">${currentPrice.toFixed(2)}</span>
              {product.buyPrice && (
                <span className="text-sm text-gray-500 ml-2">Cost: ${product.buyPrice.toFixed(2)}</span>
              )}
            </div>

            {/* Variations */}
            {product.hasVariations && product.variations?.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Variation</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {product.variations.map((variation, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedVariation(variation)}
                      className={`px-3 py-2 rounded-lg border transition-all ${
                        selectedVariation?._id === variation._id
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      <div className="font-medium">{variation.name}</div>
                      <div className="text-sm">${variation.price}</div>
                      <div className={`text-xs ${variation.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {variation.stock > 0 ? `${variation.stock} in stock` : 'Out of stock'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.hasColors && product.colors?.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Color</label>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        selectedColor?._id === color._id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: color.code }}
                      />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <FiMinus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="1"
                  max={totalStock}
                />
                <button
                  onClick={() => setQuantity(Math.min(totalStock, quantity + 1))}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all"
                  disabled={quantity >= totalStock}
                >
                  <FiPlus className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500 ml-2">{totalStock} units available</span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              disabled={totalStock === 0}
              className={`w-full btn-primary flex items-center justify-center gap-2 py-3 transition-all hover:scale-105 ${
                totalStock === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FiShoppingCart className="h-5 w-5" />
              {totalStock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </motion.div>

          {/* Description */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{product.longDescription}</p>
            </div>
          </motion.div>

          {/* Categories */}
          {product.categories && product.categories.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiFolder className="h-5 w-5" />
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category, index) => {
                  const categoryName = typeof category === 'object' ? category.name : category;
                  return (
                    <Link
                      key={index}
                      to={`/categories/${typeof category === 'object' ? category._id : category}`}
                      className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
                    >
                      {categoryName}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Variations Table */}
          {product.hasVariations && product.variations?.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiBarChart2 className="h-5 w-5" />
                Variations
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Variation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {product.variations.map((variation, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm">{variation.name}</td>
                        <td className="px-4 py-3 text-sm">${variation.price}</td>
                        <td className="px-4 py-3 text-sm">${variation.buyPrice}</td>
                        <td className="px-4 py-3 text-sm">
                          {variation.stock <= 5 ? (
                            <span className="text-yellow-600">{variation.stock}</span>
                          ) : (
                            variation.stock
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">{variation.sku || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FiTag className="h-4 w-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* YouTube Video */}
          {product.youtubeVideoUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiVideo className="h-5 w-5" />
                Product Video
              </h3>
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${product.youtubeVideoId}`}
                  title="Product Video"
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          )}

          {/* Metadata */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-3">Product Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.brand && (
                <>
                  <p className="text-gray-600">Brand</p>
                  <p className="font-medium">{product.brand}</p>
                </>
              )}
              {product.weight?.value && (
                <>
                  <p className="text-gray-600">Weight</p>
                  <p className="font-medium">{product.weight.value} {product.weight.unit}</p>
                </>
              )}
              {product.dimensions?.length && (
                <>
                  <p className="text-gray-600">Dimensions</p>
                  <p className="font-medium">
                    {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensions.unit}
                  </p>
                </>
              )}
              <p className="text-gray-600">Rating</p>
              <p className="font-medium flex items-center gap-1">
                {product.rating?.toFixed(1)} / 5
                <FiStar className="h-4 w-4 text-yellow-400 fill-current" />
                ({product.totalReviews || 0} reviews)
              </p>
              <p className="text-gray-600">Created</p>
              <p className="font-medium">{format(new Date(product.createdAt), 'MMM dd, yyyy')}</p>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-medium">{format(new Date(product.updatedAt), 'MMM dd, yyyy')}</p>
              <p className="text-gray-600">Total Views</p>
              <p className="font-medium">{product.views || 0}</p>
              <p className="text-gray-600">Total Sales</p>
              <p className="font-medium">{product.sales || 0}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
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

      <StockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        onConfirm={handleUpdateStock}
        product={product}
        stockUpdate={stockUpdate}
        setStockUpdate={setStockUpdate}
      />

      <BarcodeModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        product={product}
        onSave={handleSaveBarcode}
      />

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        product={product}
        onSave={handleSaveQR}
      />
    </div>
  );
};

export default ProductDetail;