// pages/products/ProductsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService, categoryService } from '../../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiPackage, 
  FiDollarSign, FiFilter, FiRefreshCw, FiAlertCircle, 
  FiChevronLeft, FiChevronRight, FiPrinter, FiDownload,
  FiRotateCw, FiMoreVertical, FiCopy, FiCheck, FiGrid,
  FiBarChart2, FiTag, FiStar, FiCalendar, FiUpload, FiX,
  FiScan, FiLink, FiShare2, FiHeart, FiTrendingUp, FiAward
} from 'react-icons/fi';
import { BiBarcode, BiQr } from 'react-icons/bi';
import { format } from 'date-fns';
import DeleteModal from './DeleteModal';
import StockModal from './';
import BarcodeModal from '../../components/products/BarcodeModal';
import QRCodeModal from '../../components/products/QRCodeModal';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockUpdate, setStockUpdate] = useState({ stock: 0, type: 'set', variationId: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
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
  const [viewMode, setViewMode] = useState('grid');
  const [isScanning, setIsScanning] = useState(false);
  const [scanInput, setScanInput] = useState('');

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

  const handleBarcodeSearch = async () => {
    if (!barcodeSearch.trim()) return;
    
    try {
      const response = await productService.getProductByBarcode(barcodeSearch);
      if (response.data.data) {
        navigate(`/products/${response.data.data._id}`);
      }
    } catch (error) {
      toast.error('Product not found with this barcode');
    }
  };

  const handleScanBarcode = () => {
    setIsScanning(true);
    // Simulate scanner input - in production, use actual barcode scanner API
    setTimeout(() => {
      setIsScanning(false);
      if (scanInput) {
        handleBarcodeSearchWithValue(scanInput);
        setScanInput('');
      }
    }, 1000);
  };

  const handleBarcodeSearchWithValue = async (barcode) => {
    try {
      const response = await productService.getProductByBarcode(barcode);
      if (response.data.data) {
        navigate(`/products/${response.data.data._id}`);
      }
    } catch (error) {
      toast.error('Product not found with this barcode');
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      await productService.deleteProduct(selectedProduct._id);
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;
    try {
      await productService.updateStock(selectedProduct._id, stockUpdate);
      toast.success('Stock updated successfully');
      setShowStockModal(false);
      setStockUpdate({ stock: 0, type: 'set', variationId: '' });
      setSelectedProduct(null);
      fetchProducts();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleSaveBarcode = async (barcodeData) => {
    if (!selectedProduct) return;
    try {
      const formData = new FormData();
      formData.append('barcode', JSON.stringify(barcodeData));
      await productService.updateProduct(selectedProduct._id, formData);
      toast.success('Barcode saved successfully');
      setShowBarcodeModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save barcode');
    }
  };

  const handleSaveQR = async (qrData) => {
    if (!selectedProduct) return;
    try {
      const formData = new FormData();
      formData.append('qrCode', JSON.stringify(qrData));
      await productService.updateProduct(selectedProduct._id, formData);
      toast.success('QR code saved successfully');
      setShowQRModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save QR code');
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
            <div class="no-print" style="margin-top: 20px;">
              <button onclick="window.print()">Print</button>
              <button onclick="window.close()">Close</button>
            </div>
          </div>
          <script>window.print();setTimeout(()=>window.close(),500);</script>
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
            }
            img { max-width: 200px; margin: 20px auto; }
            .product-name { font-size: 18px; font-weight: bold; margin-top: 15px; }
            @media print { body { background: white; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <img src="${qrUrl}" alt="QR Code" />
            <div class="product-name">${product.productName}</div>
            <div class="no-print" style="margin-top: 20px;">
              <button onclick="window.print()">Print</button>
              <button onclick="window.close()">Close</button>
            </div>
          </div>
          <script>window.print();setTimeout(()=>window.close(),500);</script>
        </body>
      </html>
    `);
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

  const StatCard = ({ title, value, icon: Icon, color, trend, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:scale-105"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className={`${color} p-3 rounded-lg transition-all duration-300 group-hover:scale-110`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const ActionMenu = ({ product, onClose }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1"
    >
      <Link to={`/products/${product._id}`} onClick={onClose} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
        <FiEye className="h-4 w-4" /> View Details
      </Link>
      <Link to={`/products/edit/${product._id}`} onClick={onClose} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
        <FiEdit2 className="h-4 w-4" /> Edit Product
      </Link>
      <button onClick={() => { setSelectedProduct(product); setShowStockModal(true); onClose(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
        <FiRotateCw className="h-4 w-4" /> Update Stock
      </button>
      <button onClick={() => { setSelectedProduct(product); setShowBarcodeModal(true); onClose(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
        <BiBarcode className="h-4 w-4" /> Generate Barcode
      </button>
      <button onClick={() => { setSelectedProduct(product); setShowQRModal(true); onClose(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
        <BiQr className="h-4 w-4" /> Generate QR Code
      </button>
      {product.barcode?.number && (
        <>
          <div className="border-t border-gray-100 my-1"></div>
          <button onClick={() => { handlePrintBarcode(product); onClose(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
            <FiPrinter className="h-4 w-4" /> Print Barcode
          </button>
          <button onClick={() => { handleCopyBarcode(product.barcode.number); onClose(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
            {copiedBarcode === product.barcode.number ? <FiCheck className="h-4 w-4 text-green-600" /> : <FiCopy className="h-4 w-4" />}
            Copy Barcode
          </button>
        </>
      )}
      <button onClick={() => { handlePrintQR(product); onClose(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
        <BiQr className="h-4 w-4" /> Print QR Code
      </button>
      <div className="border-t border-gray-100 my-1"></div>
      <button onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); onClose(); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
        <FiTrash2 className="h-4 w-4" /> Delete Product
      </button>
    </motion.div>
  );

  const ProductCard = ({ product, index }) => {
    const stockStatus = getStockStatus(product);
    const StockIcon = stockStatus.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 relative group"
      >
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
          {product.mainImage?.url ? (
            <img src={product.mainImage.url} alt={product.productName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="flex items-center justify-center h-full"><FiPackage className="h-12 w-12 text-gray-400" /></div>
          )}
          <div className="absolute top-2 left-2">{getStatusBadge(product)}</div>
          <div className="absolute top-2 right-2 flex gap-1">
            {product.isFeatured && <div className="bg-amber-500 text-white p-1 rounded-full"><FiStar className="h-3 w-3" /></div>}
            {product.isHotSale && <div className="bg-red-500 text-white p-1 rounded-full"><FiTrendingUp className="h-3 w-3" /></div>}
            {product.isTopRated && <div className="bg-purple-500 text-white p-1 rounded-full"><FiAward className="h-3 w-3" /></div>}
            <button onClick={() => setOpenActionMenu(openActionMenu === product._id ? null : product._id)} className="bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100 transition-colors">
              <FiMoreVertical className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          {openActionMenu === product._id && <ActionMenu product={product} onClose={() => setOpenActionMenu(null)} />}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.productName}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.shortDescription}</p>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-primary-600">${(product.price || 0).toFixed(2)}</span>
              {product.buyPrice && <span className="text-xs text-gray-500 ml-1">Cost: ${(product.buyPrice || 0).toFixed(2)}</span>}
            </div>
            <div className="flex items-center gap-1"><FiStar className="h-3 w-3 text-yellow-400 fill-current" /><span className="text-sm text-gray-600">{(product.rating || 0).toFixed(1)}</span></div>
          </div>

          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color} mb-3`}>
            {StockIcon && <StockIcon className="h-3 w-3" />}
            {stockStatus.text} ({stockStatus.stockCount})
          </div>

          {product.barcode?.number && (
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded">
              <span className="font-mono">{product.barcode.number}</span>
              <button onClick={() => handleCopyBarcode(product.barcode.number)} className="text-primary-600 hover:text-primary-700">
                {copiedBarcode === product.barcode.number ? <FiCheck className="h-3 w-3" /> : <FiCopy className="h-3 w-3" />}
              </button>
            </div>
          )}

          <div className="flex gap-1 pt-3 border-t border-gray-100">
            <Link to={`/products/${product._id}`} className="flex-1 btn-secondary text-center text-xs py-2 rounded-lg transition-all hover:scale-105"><FiEye className="h-3 w-3 mx-auto" /></Link>
            <Link to={`/products/edit/${product._id}`} className="flex-1 bg-primary-600 text-white text-center text-xs py-2 rounded-lg hover:bg-primary-700 transition-all hover:scale-105"><FiEdit2 className="h-3 w-3 mx-auto" /></Link>
            <button onClick={() => { setSelectedProduct(product); setShowStockModal(true); }} className="flex-1 bg-blue-50 text-blue-600 rounded-lg text-xs py-2 hover:bg-blue-100 transition-all hover:scale-105"><FiRotateCw className="h-3 w-3 mx-auto" /></button>
            <button onClick={() => { setSelectedProduct(product); setShowBarcodeModal(true); }} className="flex-1 bg-purple-50 text-purple-600 rounded-lg text-xs py-2 hover:bg-purple-100 transition-all hover:scale-105"><BiBarcode className="h-3 w-3 mx-auto" /></button>
            <button onClick={() => { setSelectedProduct(product); setShowQRModal(true); }} className="flex-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs py-2 hover:bg-indigo-100 transition-all hover:scale-105"><BiQr className="h-3 w-3 mx-auto" /></button>
          </div>
        </div>
      </motion.div>
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
        <Link to="/products/create" className="btn-primary flex items-center gap-2 transition-all hover:scale-105">
          <FiPlus className="h-5 w-5" />
          Add New Product
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard title="Total Products" value={stats.totalProducts || 0} icon={FiPackage} color="bg-blue-500" delay={0} />
          <StatCard title="Published" value={stats.publishedProducts || 0} icon={FiEye} color="bg-green-500" delay={0.1} />
          <StatCard title="Low Stock Items" value={stats.lowStockProducts || 0} icon={FiAlertCircle} color="bg-yellow-500" delay={0.2} />
          <StatCard title="Featured" value={stats.featuredProducts || 0} icon={FiStar} color="bg-amber-500" delay={0.3} />
          <StatCard title="Hot Sale" value={stats.hotSaleProducts || 0} icon={FiTrendingUp} color="bg-red-500" delay={0.4} />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search products by name, description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          
          {/* Barcode Scanner */}
          <div className="flex gap-2">
            <div className="relative flex-1 lg:w-64">
              <BiBarcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Scan or enter barcode..." value={barcodeSearch} onChange={(e) => setBarcodeSearch(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono" />
            </div>
            <button onClick={handleBarcodeSearch} className="btn-primary flex items-center gap-1"><FiSearch className="h-4 w-4" /> Find</button>
            <button onClick={() => { setIsScanning(true); setTimeout(() => { setIsScanning(false); handleBarcodeSearch(); }, 1500); }} className="btn-secondary flex items-center gap-1" disabled={isScanning}>
              {isScanning ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div> : <FiScan className="h-4 w-4" />}
              Scan
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 transition-all ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}><FiGrid className="h-4 w-4" /></button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 transition-all ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}><FiBarChart2 className="h-4 w-4" /></button>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2"><FiFilter className="h-4 w-4" /> Filters</button>
            <button onClick={fetchProducts} className="btn-secondary flex items-center gap-2"><FiRefreshCw className="h-4 w-4 animate-spin-slow" /> Refresh</button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t border-gray-200 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="draft">Draft</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Published</label><select value={filters.isPublished} onChange={(e) => setFilters({ ...filters, isPublished: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">All Categories</option>{categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label><input type="number" placeholder="Min Price" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label><input type="number" placeholder="Max Price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => { setFilters({ status: 'all', isPublished: 'all', category: '', minPrice: '', maxPrice: '', sortBy: '-createdAt' }); setSearchTerm(''); setBarcodeSearch(''); }} className="text-sm text-primary-600 hover:text-primary-700">Clear All Filters</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
      ) : products.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
          <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first product</p>
          <Link to="/products/create" className="btn-primary inline-flex items-center gap-2"><FiPlus className="h-5 w-5" /> Add New Product</Link>
        </motion.div>
      ) : (
        <>
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3"}>
            {products.map((product, index) => <ProductCard key={product._id} product={product} index={index} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"><FiChevronLeft className="h-5 w-5" /></button>
              <span className="px-4 py-2 text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"><FiChevronRight className="h-5 w-5" /></button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <DeleteModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedProduct(null); }} onConfirm={handleDeleteProduct} productName={selectedProduct?.productName} />
      <StockModal isOpen={showStockModal} onClose={() => { setShowStockModal(false); setSelectedProduct(null); setStockUpdate({ stock: 0, type: 'set', variationId: '' }); }} onConfirm={handleUpdateStock} product={selectedProduct} stockUpdate={stockUpdate} setStockUpdate={setStockUpdate} />
      <BarcodeModal isOpen={showBarcodeModal} onClose={() => { setShowBarcodeModal(false); setSelectedProduct(null); }} product={selectedProduct} onSave={handleSaveBarcode} />
      <QRCodeModal isOpen={showQRModal} onClose={() => { setShowQRModal(false); setSelectedProduct(null); }} product={selectedProduct} onSave={handleSaveQR} />
    </div>
  );
};

export default ProductsList;