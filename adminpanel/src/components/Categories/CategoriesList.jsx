import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiFolder, 
  FiGrid,
  FiFilter,
  FiRefreshCw,
  FiChevronRight,
  FiChevronDown,
  FiEye,
  FiHome
} from 'react-icons/fi';

const CategoriesList = () => {
  const { hasRole } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or hierarchical
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    if (viewMode === 'hierarchical') {
      fetchCategoryTree();
    } else {
      fetchCategories();
    }
  }, [viewMode, searchTerm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await categoryService.getCategories(params);
      setCategories(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryTree = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getCategoryTree();
      setCategories(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch category tree');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await categoryService.deleteCategory(selectedCategory._id);
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      if (viewMode === 'hierarchical') {
        fetchCategoryTree();
      } else {
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderHierarchicalCategory = (category, level = 0) => {
    const isExpanded = expandedNodes.has(category._id);
    const hasChildren = category.children && category.children.length > 0;
    
    return (
      <div key={category._id} className="select-none">
        <div 
          className={`flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 ${
            level > 0 ? 'ml-' + (level * 6) : ''
          }`}
          style={{ marginLeft: level * 24 }}
        >
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => hasChildren && toggleExpand(category._id)}
              className="text-gray-400 hover:text-gray-600"
            >
              {hasChildren ? (
                isExpanded ? <FiChevronDown className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />
              ) : (
                <div className="w-4" />
              )}
            </button>
            {category.image?.url ? (
              <img src={category.image.url} alt={category.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                <FiFolder className="h-4 w-4 text-primary-600" />
              </div>
            )}
            <div>
              <Link 
                to={`/categories/${category._id}`}
                className="font-medium text-gray-900 hover:text-primary-600"
              >
                {category.name}
              </Link>
              {category.description && (
                <p className="text-xs text-gray-500 mt-0.5">{category.description.substring(0, 60)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {category.isFeatured && (
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Featured
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              category.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {category.status}
            </span>
            <Link
              to={`/categories/edit/${category._id}`}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            >
              <FiEdit2 className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                setSelectedCategory(category);
                setShowDeleteModal(true);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {category.children.map(child => renderHierarchicalCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${color} p-2 rounded-lg`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );

  // Calculate stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.status === 'active').length;
  const featuredCategories = categories.filter(c => c.isFeatured).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">Organize your products with categories and subcategories</p>
        </div>
        <Link to="/categories/create" className="btn-primary flex items-center gap-2">
          <FiPlus className="h-5 w-5" />
          Add New Category
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Categories" value={totalCategories} icon={FiFolder} color="bg-blue-500" />
        <StatCard title="Active Categories" value={activeCategories} icon={FiEye} color="bg-green-500" />
        <StatCard title="Featured" value={featuredCategories} icon={FiGrid} color="bg-purple-500" />
      </div>

      {/* Search and View Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchCategories()}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('hierarchical')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'hierarchical' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiFolder className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => viewMode === 'grid' ? fetchCategories() : fetchCategoryTree()} className="btn-secondary flex items-center gap-2">
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Categories Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="card text-center py-12">
          <FiFolder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first category</p>
          <Link to="/categories/create" className="btn-primary inline-flex items-center gap-2">
            <FiPlus className="h-5 w-5" />
            Add New Category
          </Link>
        </div>
      ) : viewMode === 'hierarchical' ? (
        <div className="card overflow-hidden p-0">
          <div className="divide-y divide-gray-100">
            {categories.map(category => renderHierarchicalCategory(category, 0))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              {/* Category Image */}
              <div className="relative h-32 bg-gradient-to-r from-primary-50 to-primary-100">
                {category.image?.url ? (
                  <img
                    src={category.image.url}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FiFolder className="h-12 w-12 text-primary-300" />
                  </div>
                )}
                {category.isFeatured && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded-full">
                      Featured
                    </span>
                  </div>
                )}
              </div>

              {/* Category Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      <Link to={`/categories/${category._id}`} className="hover:text-primary-600">
                        {category.name}
                      </Link>
                    </h3>
                    {category.parentCategory && (
                      <p className="text-xs text-gray-500 mt-1">
                        Parent: {typeof category.parentCategory === 'object' ? category.parentCategory.name : 'Root'}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    category.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.status}
                  </span>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {category.description}
                  </p>
                )}

                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">
                      Subcategories: {category.subcategories.length}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Link
                    to={`/categories/${category._id}`}
                    className="flex-1 btn-secondary text-center text-sm py-1.5"
                  >
                    <FiEye className="h-4 w-4 inline mr-1" />
                    View
                  </Link>
                  <Link
                    to={`/categories/edit/${category._id}`}
                    className="flex-1 btn-primary text-center text-sm py-1.5"
                  >
                    <FiEdit2 className="h-4 w-4 inline mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
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
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowDeleteModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete category "{selectedCategory?.name}"? 
                This will also remove this category from all products. 
                {selectedCategory?.subcategories?.length > 0 && (
                  <span className="text-red-600 block mt-2">
                    Warning: This category has {selectedCategory.subcategories.length} subcategories that will also be affected!
                  </span>
                )}
              </p>
              
              <div className="flex gap-3">
                <button onClick={handleDeleteCategory} className="btn-primary flex-1 bg-red-600 hover:bg-red-700">
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
    </div>
  );
};

export default CategoriesList;