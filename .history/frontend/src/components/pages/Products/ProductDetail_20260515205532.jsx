// pages/products/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPackage, FiDollarSign,
  FiGrid, FiStar, FiBarChart2, FiEye, FiTag, FiCalendar,
  FiVideo, FiRefreshCw, FiFolder, FiPrinter, FiDownload,
  FiCopy, FiCheck, FiShare2, FiExternalLink
} from 'react-icons/fi';
import { BiBarcode, BiQr } from 'react-icons/bi';
import { format } from 'date-fns';
import DeleteModal from '../../components/products/DeleteModal';
import StockModal from '../../components/products/StockModal';

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
