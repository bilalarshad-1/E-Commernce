import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiPackage,
  FiDollarSign,
  FiGrid,
  FiStar,
  FiBarChart2,
  FiEye,
  FiTag,
  FiCalendar,
  FiUser,
  FiQrCode,
  FiBarcode,
  FiVideo,
  FiPlus,
  FiMinus,
  FiRefreshCw
} from 'react-icons/fi';
import { format } from 'date-fns';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdate, setStockUpdate] = useState({
    stock: 0,
    type: 'set',
    variationId: ''
  });
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productService.getProduct(id);
      setProduct(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted successfully');
      navigate('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
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

  const handlePrintBarcode = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode - ${product.productName}</title>
          <style>
            body { font-family: Arial; padding: 20px; text-align: center; }
            img { max-width: 300px; margin: 20px auto; }
            .product-name { font-size: 14px; margin-top: 10px; }
            .barcode-number { font-size: 12px; color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          <img src="${product.barcode.imageUrl}" alt="Barcode" />
          <div class="product-name">${product.productName}</div>
          <div class="barcode-number">${product.barcode.number}</div>
          <script>window.print();setTimeout(function(){window.close();},500);<\/script>
        </body>
      </html>
    `);
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${product.productName}</title>
          <style>
            body { font-family: Arial; padding: 20px; text-align: center; }
            img { max-width: 200px; margin: 20px auto; }
            .product-name { font-size: 14px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <img src="${product.qrCode.imageUrl}" alt="QR Code" />
          <div class="product-name">${product.productName}</div>
          <script>window.print();setTimeout(function(){window.close();},500);<\/script>
        </body>
      </html>
    `);
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
      <div className="card text-center py-12">
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

  const totalStock = product.hasVariations
    ? product.variations.reduce((sum, v) => sum + v.stock, 0)
    : product.inventory.currentStock;

  const profitMargin = ((product.price - product.buyPrice) / product.price * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/products" className="text-gray-600 hover:text-gray-900">
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
            <p className="text-gray-600 mt-1">SKU: {product._id.slice(-8)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/products/edit/${id}`)}
            className="btn-primary flex items-center gap-2"
          >
            <FiEdit2 className="h-4 w-4" />
            Edit Product
          </button>
          <button
            onClick={() => setShowStockModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            Update Stock
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {allImages[activeImage]?.url ? (
                  <img
                    src={allImages[activeImage].url}
                    alt={product.productName}
                    className="w-full h-full object-cover"
                  />
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
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        activeImage === index ? 'border-primary-600' : 'border-transparent'
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

          {/* Barcode & QR */}
          <div className="card mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Barcode & QR Code</h3>
            <div className="space-y-4">
              {product.barcode && (
                <div className="text-center">
                  <img
                    src={product.barcode.imageUrl}
                    alt="Barcode"
                    className="mx-auto max-w-full h-20 object-contain"
                  />
                  <p className="text-sm font-mono mt-2">{product.barcode.number}</p>
                  <button
                    onClick={handlePrintBarcode}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Print Barcode
                  </button>
                </div>
              )}
              {product.qrCode && (
                <div className="text-center border-t pt-4">
                  <img
                    src={product.qrCode.imageUrl}
                    alt="QR Code"
                    className="mx-auto w-24 h-24 object-contain"
                  />
                  <button
                    onClick={handlePrintQR}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Print QR Code
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Pricing */}
          <div className="card">
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
          </div>

          {/* Pricing Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiDollarSign className="h-5 w-5" />
              Pricing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Selling Price</p>
                <p className="text-2xl font-bold text-primary-600">${product.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost Price</p>
                <p className="text-lg font-medium text-gray-900">${product.buyPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{product.longDescription}</p>
            </div>
          </div>

          {/* Variations */}
          {product.hasVariations && product.variations.length > 0 && (
            <div className="card">
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
                        <td className="px-4 py-3 text-sm font-mono">{variation.sku}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Colors */}
          {product.hasColors && product.colors.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Available Colors</h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full border"
                      style={{ backgroundColor: color.code }}
                    />
                    <span className="text-sm">{color.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags & Categories */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FiTag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {(!product.tags || product.tags.length === 0) && (
                    <p className="text-sm text-gray-500">No tags</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {product.categories?.map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs"
                    >
                      {category}
                    </span>
                  ))}
                  {(!product.categories || product.categories.length === 0) && (
                    <p className="text-sm text-gray-500">No categories</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* YouTube Video */}
          {product.youtubeVideoUrl && (
            <div className="card">
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
            </div>
          )}

          {/* Metadata */}
          <div className="card">
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
              <p className="text-gray-600">Created</p>
              <p className="font-medium">{format(new Date(product.createdAt), 'MMM dd, yyyy')}</p>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-medium">{format(new Date(product.updatedAt), 'MMM dd, yyyy')}</p>
              <p className="text-gray-600">Total Views</p>
              <p className="font-medium">{product.views}</p>
              <p className="text-gray-600">Total Sales</p>
              <p className="font-medium">{product.sales}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{product.productName}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={handleDeleteProduct} className="btn-primary flex-1 bg-red-600 hover:bg-red-700">
                  Delete
                </button>
                <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowStockModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Update Stock</h3>
              <div className="space-y-4">
                {product.hasVariations && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variation</label>
                    <select
                      value={stockUpdate.variationId}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, variationId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">All Variations</option>
                      {product.variations.map((v, i) => (
                        <option key={i} value={v._id}>{v.name} (Current: {v.stock})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Type</label>
                  <select
                    value={stockUpdate.type}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="set">Set to specific quantity</option>
                    <option value="increase">Increase by quantity</option>
                    <option value="decrease">Decrease by quantity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={stockUpdate.stock}
                    onChange={(e) => setStockUpdate({ ...stockUpdate, stock: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleUpdateStock} className="btn-primary flex-1">
                  Update Stock
                </button>
                <button onClick={() => setShowStockModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;