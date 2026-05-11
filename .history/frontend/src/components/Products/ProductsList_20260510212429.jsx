import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService, categoryService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiPackage, 
  FiDollarSign, 
  FiGrid,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

const ProductsList = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchCategories();
  }, [currentPage, filters]);

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

  const handleDeleteProduct = async () => {
    try {
      await productService.deleteProduct(selectedProduct._id);
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      fetchProducts();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
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
      return { text: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: FiAlertCircle };
    }
    if (stock <= threshold) {
      return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: FiAlertCircle };
    }
    return { text: `${stock} in stock`, color: 'bg-green-100 text-green-800', icon: null };
  };

  const getCategoryNames = (product) => {
    if (!product.categories || product.categories.length === 0) return '';
    if (typeof product.categories[0] === 'object') {
      return product.categories.map(c => c.name).join(', ');
    }
    return product.categories.join(', ');
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

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
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, description, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
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
                  className="input-field"
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
                  className="input-field"
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
                  className="input-field"
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
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
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
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const stockStatus = getStockStatus(product);
              const StockIcon = stockStatus.icon;
              const categoryNames = getCategoryNames(product);
              
              return (
                <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
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
                    <div className="absolute top-2 right-2 flex gap-1">
                      {getStatusBadge(product)}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {product.productName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.shortDescription}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-primary-600">
                          ${(product.price || 0).toFixed(2)}
                        </span>
                        {product.buyPrice && (
                          <span className="text-xs text-gray-500 ml-1">
                            (Cost: ${(product.buyPrice || 0).toFixed(2)})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600 ml-1">
                          {(product.rating || 0).toFixed(1)} ({product.totalReviews || 0})
                        </span>
                      </div>
                    </div>

                    {/* Categories */}
                    {categoryNames && (
                      <div className="text-xs text-gray-500 mb-2 line-clamp-1">
                        <span className="font-medium">Categories:</span> {categoryNames}
                      </div>
                    )}

                    {/* Stock Status */}
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color} mb-3`}>
                      {StockIcon && <StockIcon className="h-3 w-3" />}
                      {stockStatus.text}
                    </div>

                    {/* Barcode */}
                    {product.barcode?.number && (
                      <div className="text-xs text-gray-500 mb-3">
                        <span className="font-medium">Barcode:</span> {product.barcode.number}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <Link
                        to={`/products/${product._id}`}
                        className="flex-1 btn-secondary text-center text-sm py-1.5"
                      >
                        <FiEye className="h-4 w-4 inline mr-1" />
                        View
                      </Link>
                      <Link
                        to={`/products/edit/${product._id}`}
                        className="flex-1 btn-primary text-center text-sm py-1.5"
                      >
                        <FiEdit2 className="h-4 w-4 inline mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowDeleteModal(true);
                        }}
                        className="flex-1 bg-red-50 text-red-600 rounded-lg text-sm py-1.5 hover:bg-red-100 transition-colors"
                      >
                        <FiTrash2 className="h-4 w-4 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowDeleteModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{selectedProduct?.productName}"? 
                This will also delete all associated images and variations. This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button onClick={handleDeleteProduct} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Delete
                </button>
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
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

export default ProductsList;