// pages/products/ProductsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService, categoryService } from '../../../services/api';
import toast from 'react-hot-toast';
import { 
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiPackage, 
  FiDollarSign, FiFilter, FiRefreshCw, FiAlertCircle, 
  FiChevronLeft, FiChevronRight, FiPrinter, FiDownload,
  FiRotateCw, FiMoreVertical, FiCopy, FiCheck, FiGrid,
  FiBarChart2, FiTag, FiStar, FiCalendar, FiUpload
} from 'react-icons/fi';
import { BiBarcode, BiQr } from 'react-icons/bi';
import { format } from 'date-fns';
import DeleteModal from '../../Products/DeleteModal';
import StockModal from '../../Products/StockModal';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    isPublished: 'all',
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: '-createdAt'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [stats, setStats] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [copiedBarcode, setCopiedBarcode] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchCategories();
  }, [currentPage, filters]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        sort: filters.sortBy,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.isPublished !== 'all' && { isPublished: filters.isPublished === 'published' }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice })
      };
      const response = await productService.getProducts(params);
      setProducts(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setTotalProducts(response.data.pagination.total);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await productService.getProductStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories({ limit: 100 });
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handlePrintBarcode = (product) => {
    if (!product.barcode?.number) {
      toast.error('No barcode available for this product');
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
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              text-align: center;
            }
            .barcode-number {
              font-size: 32px;
              letter-spacing: 3px;
              margin: 20px 0;
              font-weight: bold;
            }
            .product-name {
              font-size: 18px;
              margin-bottom: 10px;
              color: #333;
            }
            .price {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-top: 10px;
            }
            .sku {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
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
            <div class="sku">SKU: ${product._id?.slice(-8)}</div>
            <div class="no-print" style="margin-top: 20px;">
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

  const handlePrintQR = (product) => {
    const qrUrl = product.qrCode?.imageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/product/${product._id}`)}`;
    
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
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            img { 
              max-width: 200px; 
              margin: 20px auto;
            }
            .product-name { 
              font-size: 18px; 
              font-weight: bold;
              margin-top: 15px;
            }
            .product-id {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
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
            <div class="product-id">ID: ${product._id}</div>
            <div class="no-print" style="margin-top: 20px;">
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

  const handleDownloadBarcode = async (product) => {
    if (!product.barcode?.number) {
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
      handlePrintBarcode(product);
    }
  };

  const handleDownloadQR = async (product) => {
    const qrUrl = product.qrCode?.imageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/product/${product._id}`)}`;
    
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

  const handleCopyBarcode = (barcodeNumber) => {
    navigator.clipboard.writeText(barcodeNumber);
    setCopiedBarcode(barcodeNumber);
    toast.success('Barcode copied to clipboard');
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const getStatusBadge = (product) => {
    if (!product.isPublished) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Draft</span>;
    }
    if (product.status === 'active') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Published</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>;
  };

  const getStockStatus = (product) => {
    const stock = product.hasVariations && product.variations?.length > 0
      ? product.variations.reduce((sum, v) => sum + (v.stock || 0), 0)
      : product.inventory?.currentStock || 0;
    const threshold = product.inventory?.lowStockThreshold || 10;
    
    if (stock <= 0) {
      return { text: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: FiAlertCircle, stockCount: stock };
    }
    if (stock <= threshold) {
      return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: FiAlertCircle, stockCount: stock };
    }
    return { text: 'In Stock', color: 'bg-green-100 text-green-800', icon: null, stockCount: stock };
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ActionMenu = ({ product, onClose }) => (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
      <Link
        to={`/products/${product._id}`}
        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        onClick={onClose}
      >
        <FiEye className="h-4 w-4" />
        View Details
      </Link>
      <Link
        to={`/products/edit/${product._id}`}
        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        onClick={onClose}
      >
        <FiEdit2 className="h-4 w-4" />
        Edit Product
      </Link>
      <button
        onClick={() => {
          setSelectedProduct(product);
          setShowStockModal(true);
          onClose();
        }}
        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
      >
        <FiRotateCw className="h-4 w-4" />
        Update Stock
      </button>
      
      <div className="border-t border-gray-100 my-1"></div>
      
      {product.barcode?.number && (
        <>
          <button
            onClick={() => {
              handlePrintBarcode(product);
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
          >
            <FiPrinter className="h-4 w-4" />
            Print Barcode
          </button>
          <button
            onClick={() => {
              handleDownloadBarcode(product);
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
          >
            <FiDownload className="h-4 w-4" />
            Download Barcode
          </button>
          <button
            onClick={() => {
              handleCopyBarcode(product.barcode.number);
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
          >
            {copiedBarcode === product.barcode.number ? (
              <FiCheck className="h-4 w-4 text-green-600" />
            ) : (
              <FiCopy className="h-4 w-4" />
            )}
            Copy Barcode
          </button>
        </>
      )}
      
      <button
        onClick={() => {
          handlePrintQR(product);
          onClose();
        }}
        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
      >
        <BiQr className="h-4 w-4" />
        Print QR Code
      </button>
      <button
        onClick={() => {
          handleDownloadQR(product);
          onClose();
        }}
        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
      >
        <FiDownload className="h-4 w-4" />
        Download QR Code
      </button>
      
      <div className="border-t border-gray-100 my-1"></div>
      
      <button
        onClick={() => {
          setSelectedProduct(product);
          setShowDeleteModal(true);
          onClose();
        }}
        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
      >
        <FiTrash2 className="h-4 w-4" />
        Delete Product
      </button>
    </div>
  );

  const ProductGridView = ({ product }) => {
    const stockStatus = getStockStatus(product);
    const StockIcon = stockStatus.icon;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 relative group">
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
          {product.mainImage?.url ? (
            <img
              src={product.mainImage.url}
              alt={product.productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <FiPackage className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            {getStatusBadge(product)}
          </div>
          
          <button
            onClick={() => setOpenActionMenu(openActionMenu === product._id ? null : product._id)}
            className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100 transition-colors"
          >
            <FiMoreVertical className="h-4 w-4 text-gray-600" />
          </button>
          
          {openActionMenu === product._id && (
            <ActionMenu product={product} onClose={() => setOpenActionMenu(null)} />
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
            {product.productName}
          </h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {product.shortDescription}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-primary-600">
                ${(product.price || 0).toFixed(2)}
              </span>
              {product.buyPrice && (
                <span className="text-xs text-gray-500 ml-1">
                  Cost: ${(product.buyPrice || 0).toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <FiStar className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {(product.rating || 0).toFixed(1)}
              </span>
            </div>
          </div>

          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color} mb-3`}>
            {StockIcon && <StockIcon className="h-3 w-3" />}
            {stockStatus.text} ({stockStatus.stockCount})
          </div>

          {product.barcode?.number && (
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded">
              <span className="font-mono">{product.barcode.number}</span>
              <button
                onClick={() => handleCopyBarcode(product.barcode.number)}
                className="text-primary-600 hover:text-primary-700"
                title="Copy barcode"
              >
                {copiedBarcode === product.barcode.number ? (
                  <FiCheck className="h-3 w-3" />
                ) : (
                  <FiCopy className="h-3 w-3" />
                )}
              </button>
            </div>
          )}

          <div className="flex gap-1 pt-3 border-t border-gray-100">
            <Link
              to={`/products/${product._id}`}
              className="flex-1 btn-secondary text-center text-xs py-2 rounded-lg"
              title="View Details"
            >
              <FiEye className="h-3 w-3 mx-auto" />
            </Link>
            <Link
              to={`/products/edit/${product._id}`}
              className="flex-1 bg-primary-600 text-white text-center text-xs py-2 rounded-lg hover:bg-primary-700 transition-colors"
              title="Edit Product"
            >
              <FiEdit2 className="h-3 w-3 mx-auto" />
            </Link>
            <button
              onClick={() => {
                setSelectedProduct(product);
                setShowStockModal(true);
              }}
              className="flex-1 bg-blue-50 text-blue-600 rounded-lg text-xs py-2 hover:bg-blue-100 transition-colors"
              title="Update Stock"
            >
              <FiRotateCw className="h-3 w-3 mx-auto" />
            </button>
            {product.barcode?.number && (
              <>
                <button
                  onClick={() => handlePrintBarcode(product)}
                  className="flex-1 bg-purple-50 text-purple-600 rounded-lg text-xs py-2 hover:bg-purple-100 transition-colors"
                  title="Print Barcode"
                >
                  <FiPrinter className="h-3 w-3 mx-auto" />
                </button>
                <button
                  onClick={() => handleDownloadQR(product)}
                  className="flex-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs py-2 hover:bg-indigo-100 transition-colors"
                  title="Download QR"
                >
                  <BiQr className="h-3 w-3 mx-auto" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ProductListView = ({ product }) => {
    const stockStatus = getStockStatus(product);
    const StockIcon = stockStatus.icon;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
        <div className="flex items-center p-4 gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
            {product.mainImage?.url ? (
              <img
                src={product.mainImage.url}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <FiPackage className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">
                {product.productName}
              </h3>
              {getStatusBadge(product)}
            </div>
            <p className="text-sm text-gray-600 line-clamp-1 mb-2">
              {product.shortDescription}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-bold text-primary-600">
                ${(product.price || 0).toFixed(2)}
              </span>
              <div className={`flex items-center gap-1 ${stockStatus.color} px-2 py-0.5 rounded-full text-xs`}>
                {StockIcon && <StockIcon className="h-3 w-3" />}
                {stockStatus.text} ({stockStatus.stockCount})
              </div>
              {product.barcode?.number && (
                <span className="text-xs text-gray-500 font-mono">
                  {product.barcode.number}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              to={`/products/${product._id}`}
              className="btn-secondary p-2"
              title="View Details"
            >
              <FiEye className="h-4 w-4" />
            </Link>
            <Link
              to={`/products/edit/${product._id}`}
              className="btn-primary p-2"
              title="Edit Product"
            >
              <FiEdit2 className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                setSelectedProduct(product);
                setShowStockModal(true);
              }}
              className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
              title="Update Stock"
            >
              <FiRotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpenActionMenu(openActionMenu === product._id ? null : product._id)}
              className="bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <FiMoreVertical className="h-4 w-4" />
            </button>
            {openActionMenu === product._id && (
              <ActionMenu product={product} onClose={() => setOpenActionMenu(null)} />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your products, inventory, and variations</p>
        </div>
        <Link to="/products/create" className="btn-primary flex items-center gap-2">
          <FiPlus className="h-5 w-5" />
          Add New Product
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Products" 
            value={stats.totalProducts || 0} 
            icon={FiPackage} 
            color="bg-blue-500"
          />
          <StatCard 
            title="Published" 
            value={stats.publishedProducts || 0} 
            icon={FiEye} 
            color="bg-green-500"
          />
          <StatCard 
            title="Low Stock Items" 
            value={stats.lowStockProducts || 0} 
            icon={FiAlertCircle} 
            color="bg-yellow-500"
          />
          <StatCard 
            title="Inventory Value" 
            value={`$${(stats.totalInventoryValue || 0).toLocaleString()}`} 
            icon={FiDollarSign} 
            color="bg-purple-500"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, description, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <FiGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <FiBarChart2 className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <FiFilter className="h-4 w-4" />
              Filters
            </button>
            <button onClick={fetchProducts} className="btn-secondary flex items-center gap-2">
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Published</label>
                <select
                  value={filters.isPublished}
                  onChange={(e) => setFilters({ ...filters, isPublished: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setFilters({
                    status: 'all',
                    isPublished: 'all',
                    category: '',
                    minPrice: '',
                    maxPrice: '',
                    sortBy: '-createdAt'
                  });
                  setSearchTerm('');
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
          <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first product</p>
          <Link to="/products/create" className="btn-primary inline-flex items-center gap-2">
            <FiPlus className="h-5 w-5" />
            Add New Product
          </Link>
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-3"
          }>
            {products.map((product) => (
              viewMode === 'grid' 
                ? <ProductGridView key={product._id} product={product} />
                : <ProductListView key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProduct}
        productName={selectedProduct?.productName}
      />

      <StockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        onConfirm={handleUpdateStock}
        product={selectedProduct}
        stockUpdate={stockUpdate}
        setStockUpdate={setStockUpdate}
      />
    </div>
  );
};

export default ProductsList;