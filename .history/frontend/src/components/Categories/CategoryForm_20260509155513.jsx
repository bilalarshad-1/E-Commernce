import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoryService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiSave,
  FiX,
  FiFolder,
  FiLink,
  FiEye,
  FiEyeOff,
  FiStar,
  FiUpload,
  FiChevronRight
} from 'react-icons/fi';

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(id ? true : false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    status: 'active',
    isFeatured: false,
    order: 0,
    metaTitle: '',
    metaDescription: ''
  });
  const [categoryImage, setCategoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories({ limit: 100 });
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCategory = async () => {
    try {
      const response = await categoryService.getCategory(id);
      const category = response.data.data;
      setFormData({
        name: category.name,
        description: category.description || '',
        parentCategory: category.parentCategory?._id || '',
        status: category.status,
        isFeatured: category.isFeatured,
        order: category.order || 0,
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || ''
      });
      if (category.image?.url) {
        setImagePreview(category.image.url);
      }
    } catch (error) {
      toast.error('Failed to fetch category');
      navigate('/categories');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCategoryImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      if (categoryImage) {
        submitData.append('image', categoryImage);
      }
      
      if (id) {
        await categoryService.updateCategory(id, submitData);
        toast.success('Category updated successfully');
      } else {
        await categoryService.createCategory(submitData);
        toast.success('Category created successfully');
      }
      navigate('/categories');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  // Filter out current category from parent options to prevent circular reference
  const getParentOptions = () => {
    if (!id) return categories;
    return categories.filter(cat => cat._id !== id);
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Category' : 'Create New Category'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id ? 'Update category information' : 'Add a new category to organize products'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/categories')}
            className="btn-secondary flex items-center gap-2"
          >
            <FiX className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FiSave className="h-4 w-4" />
            )}
            {id ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiFolder className="h-5 w-5 text-primary-600" />
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Electronics, Clothing, Books"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Describe this category (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  name="parentCategory"
                  value={formData.parentCategory}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">None (Root Category)</option>
                  {getParentOptions().map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent category to create a subcategory
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">SEO Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="SEO title (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  name="metaDescription"
                  rows="3"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="SEO description (optional)"
                  maxLength="160"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Category Image</h3>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setCategoryImage(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="categoryImage"
                    />
                    <label
                      htmlFor="categoryImage"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FiUpload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload image</span>
                      <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 2MB</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Status Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <FiStar className={`h-5 w-5 ${formData.isFeatured ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Feature this category</p>
                    <p className="text-xs text-gray-500">Featured categories appear prominently</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="toggle-switch"
                />
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiFolder className="h-4 w-4" />
                {formData.parentCategory ? (
                  <>
                    <span>Parent Category</span>
                    <FiChevronRight className="h-3 w-3" />
                  </>
                ) : null}
                <span className="font-medium text-gray-900">{formData.name || 'Category Name'}</span>
              </div>
              {formData.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{formData.description}</p>
              )}
              <div className="mt-2 flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  formData.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {formData.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                {formData.isFeatured && (
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CategoryForm;