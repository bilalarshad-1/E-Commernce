import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { categoryService, productService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiFolder,
  FiPackage,
  FiEye,
  FiStar,
  FiCalendar,
  FiUsers,
  FiChevronRight,
  FiGrid,
  FiList,
  FiRefreshCw
} from 'react-icons/fi';
import { format } from 'date-fns';

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productView, setProductView] = useState('grid');
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);

  useEffect(() => {
    fetchCategory();
    fetchProducts();
  }, [id, productPage]);

  const fetchCategory = async () => {
    try {
      const response = await categoryService.getCategory(id);
      setCategory(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch category');
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await categoryService.getCategoryProducts(id, {
        page: productPage,
        limit: 12,
        includeSubcategories: true
      });
      setProducts(response.data.data);
      setProductTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await categoryService.deleteCategory(id);
      toast.success('Category deleted successfully');
      navigate('/categories');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="card text-center py-12">
        <FiFolder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Category not found</h3>
        <Link to="/categories" className="btn-primary inline-flex items-center gap-2">
          <FiArrowLeft className="h-4 w-4" />
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/categories" className="text-gray-600 hover:text-gray-900">
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-3">
            {category.image?.url ? (
              <img src={category.image.url} alt={category.name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                <FiFolder className="h-6 w-6 text-primary-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
                {category.isFeatured && (
                  <FiStar className="h-5 w-5 text-yellow-500 fill-current" />
                )}
              </div>
              {category.parentCategory && (
                <p className="text-sm text-gray-500 mt-1">
                  Parent: {typeof category.parentCategory === 'object' ? category.parentCategory.name : 'Root'}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/categories/edit/${id}`}
            className="btn-primary flex items-center gap-2"
          >
            <FiEdit2 className="h-4 w-4" />
            Edit Category
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {category.description && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{category.description}</p>
            </div>
          )}

          {/* Products in Category */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiPackage className="h-5 w-5" />
                Products in this category ({productTotal})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setProductView('grid')}
                  className={`p-1 rounded ${productView === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <FiGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setProductView('list')}
                  className={`p-1 rounded ${productView === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <FiList className="h-4 w-4" />
                </button>
                <button onClick={fetchProducts} className="p-1 text-gray-400 hover:text-gray-600">
                  <FiRefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No products in this category yet</p>
                <Link to="/products/create" className="text-primary-600 text-sm hover:underline mt-2 inline-block">
                  Add a product
                </Link>
              </div>
            ) : productView === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map(product => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex gap-3">
                      {product.mainImage?.url ? (
                        <img
                          src={product.mainImage.url}
                          alt={product.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <FiPackage className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 group-hover:text-primary-600 truncate">
                          {product.productName}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">${product.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            product.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map(product => (
                      <tr key={product._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/products/${product._id}`)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.mainImage?.url ? (
                              <img src={product.mainImage.url} alt={product.productName} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <FiPackage className="h-8 w-8 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{product.productName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">${product.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">{product.inventory?.currentStock || 0}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            product.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiEye className="h-4 w-4" />
              Category Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  category.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Featured</span>
                <span>{category.isFeatured ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Display Order</span>
                <span>{category.order || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Products</span>
                <span>{productTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="text-xs">{format(new Date(category.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="text-xs">{format(new Date(category.updatedAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Subcategories */}
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiFolder className="h-4 w-4" />
                Subcategories ({category.subcategories.length})
              </h3>
              <div className="space-y-2">
                {category.subcategories.map(subcat => (
                  <Link
                    key={subcat._id}
                    to={`/categories/${subcat._id}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiFolder className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{subcat.name}</span>
                    </div>
                    <FiChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SEO Info */}
          {(category.metaTitle || category.metaDescription) && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">SEO Information</h3>
              {category.metaTitle && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500">Meta Title</p>
                  <p className="text-sm text-gray-700">{category.metaTitle}</p>
                </div>
              )}
              {category.metaDescription && (
                <div>
                  <p className="text-xs text-gray-500">Meta Description</p>
                  <p className="text-sm text-gray-700">{category.metaDescription}</p>
                </div>
              )}
            </div>
          )}
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
                Are you sure you want to delete "{category.name}"? 
                This will remove this category from all products.
                {category.subcategories?.length > 0 && (
                  <span className="text-red-600 block mt-2">
                    Warning: This category has {category.subcategories.length} subcategories!
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

export default CategoryDetail;