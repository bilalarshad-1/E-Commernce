// pages/products/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPackage, FiDollarSign,
  FiGrid, FiStar, FiBarChart2, FiEye, FiTag, FiCalendar,
  FiVideo, FiRefreshCw, FiFolder, FiPrinter, FiDownload,
  FiCopy, FiCheck, FiShare2, FiExternalLink
} from 'react-icons/fi';
import { BiBarcode, BiQr } from 'react-icons/bi';
import { format } from 'date-fns';
import DeleteModal from '../../Products/DeleteModal';
import StockModal from '../../Products/';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdate, setStockUpdate] = useState({ stock: 0, type: 'set', variationId: '' });
  const [activeImage, setActiveImage] = useState(0);
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

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
            body { 
              font-family: 'Courier New', monospace; 
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }
            .barcode-card {
              background: white;
              padding: 40px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .barcode-number {
              font-size: 36px;
              letter-spacing: 4px;
              margin: 30px 0;
              font-weight: bold;
            }
            .product-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .price {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin: 10px 0;
            }
            .details {
              font-size: 12px;
              color: #666;
              margin-top: 20px;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            @media print {
              body { background: white; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-card">
            <div class="product-name">${product.productName}</div>
            <div class="barcode-number">*${product.barcode.number}*</div>
            <div class="price">$${(product.price || 0).toFixed(2)}</div>
            <div class="details">
              <div>SKU: ${product._id?.slice(-8)}</div>
              <div>Brand: ${product.brand || 'N/A'}</div>
            </div>
            <div class="no-print" style="margin-top: 30px;">
              <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Close</button>
            </div>
          </div>
          <script>
            window.print();
            setTimeout(() => window.close(), 500);
          </script>
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
            body { 
              font-family: Arial, sans-serif; 
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }
            .qr-card {
              background: white;
              padding: 40px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            img { 
              max-width: 200px; 
              margin: 20px auto;
            }
            .product-name { 
              font-size: 20px; 
              font-weight: bold;
              margin: 20px 0 10px;
            }
            .product-url {
              font-size: 12px;
              color: #666;
              word-break: break-all;
            }
            @media print {
              body { background: white; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <img src="${qrUrl}" alt="QR Code" />
            <div class="product-name">${product.productName}</div>
            <div class="product-url">${window.location.origin}/product/${product._id}</div>
            <div class="no-print" style="margin-top: 30px;">
              <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Close</button>
            </div>
          </div>
          <script>
            window.print();
            setTimeout(() => window.close(), 500);
          </script>
        </body>
      </html>
    `);
  };

  const handleDownloadBarcode = async () => {
    if (!product?.barcode?.number) {
      toast.error('No barcode available');
      return;
    }
    
    try {
      const response = await fetch(`https://barcode.tec-it.com/barcode.ashx?data=${product.barcode.number}&code=Code128&dpi=96`);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.download = `barcode-${product.barcode.number}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Barcode downloaded');
    } catch (error) {
      handlePrintBarcode();
    }
  };

  const handleDownloadQR = async () => {
    const qrUrl = product?.qrCode?.imageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/product/${product._id}`)}`;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.download = `qrcode-${product.productName.replace(/[^a-z0-9]/gi, '_')}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('QR Code downloaded');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
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

  const totalStock = product.hasVariations && product.variations?.length > 0
    ? product.variations.reduce((sum, v) => sum + (v.stock || 0), 0)
    : product.inventory?.currentStock || 0;

  const profitMargin = product.price && product.buyPrice
    ? (((product.price - product.buyPrice) / product.price) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/products" className="text-gray-600 hover:text-gray-900">
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
            className="btn-secondary flex items-center gap-2"
          >
            {copiedUrl ? <FiCheck className="h-4 w-4" /> : <FiShare2 className="h-4 w-4" />}
            Share
          </button>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
                    <button onClick={handleCopyBarcode} className="text-primary-600 hover:text-primary-700">
                      {copiedBarcode ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                    </button>
                    <button onClick={handlePrintBarcode} className="text-primary-600 hover:text-primary-700">
                      <FiPrinter className="h-4 w-4" />
                    </button>
                    <button onClick={handleDownloadBarcode} className="text-primary-600 hover:text-primary-700">
                      <FiDownload className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="font-mono text-lg tracking-wider text-center">
                  {product.barcode.number}
                </div>
              </div>
            )}

            {product.qrCode?.imageUrl && (
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <img
                  src={product.qrCode.imageUrl}
                  alt="QR Code"
                  className="w-24 h-24 mx-auto mb-2"
                />
                <div className="flex gap-2 justify-center">
                  <button onClick={handlePrintQR} className="text-primary-600 hover:text-primary-700 text-sm">
                    <FiPrinter className="h-4 w-4 inline mr-1" />
                    Print
                  </button>
                  <button onClick={handleDownloadQR} className="text-primary-600 hover:text-primary-700 text-sm">
                    <FiDownload className="h-4 w-4 inline mr-1" />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Pricing */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiDollarSign className="h-5 w-5" />
              Pricing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Selling Price</p>
                <p className="text-2xl font-bold text-primary-600">${(product.price || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost Price</p>
                <p className="text-lg font-medium text-gray-900">${(product.buyPrice || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Categories */}
          {product.categories && product.categories.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
              {product.primaryCategory && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Primary:</span>{' '}
                  {typeof product.primaryCategory === 'object' 
                    ? product.primaryCategory.name 
                    : product.primaryCategory}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{product.longDescription}</p>
            </div>
          </div>

          {/* Variations */}
          {product.hasVariations && product.variations?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
            </div>
          )}

          {/* Colors */}
          {product.hasColors && product.colors?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
            </div>
          )}

          {/* YouTube Video */}
          {product.youtubeVideoUrl && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
              <p className="font-medium">{product.views || 0}</p>
              <p className="text-gray-600">Total Sales</p>
              <p className="font-medium">{product.sales || 0}</p>
            </div>
          </div>
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
    </div>
  );
};

export default ProductDetail;