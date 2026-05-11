import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService, categoryService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiImage,
  FiVideo,
  FiTag,
  FiPackage,
  FiDollarSign,
  FiGrid,
  FiEye,
  FiStar,
  FiBarChart2,
  FiUpload,
  FiLink
} from 'react-icons/fi';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(id ? true : false);
  const [activeTab, setActiveTab] = useState('basic');
  const [categoriesList, setCategoriesList] = useState([]);
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    buyPrice: '',
    shortDescription: '',
    longDescription: '',
    rating: 0,
    inventory: {
      currentStock: 0,
      lowStockThreshold: 10
    },
    hasVariations: false,
    variations: [],
    hasColors: false,
    colors: [],
    tags: [],
    categories: [],
    primaryCategory: '',
    brand: '',
    weight: { value: '', unit: 'kg' },
    dimensions: { length: '', width: '', height: '', unit: 'cm' },
    status: 'draft',
    isPublished: false,
    isFeatured: false,
    youtubeVideoUrl: ''
  });
  
  const [mainImage, setMainImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [newVariation, setNewVariation] = useState({ name: '', price: '', buyPrice: '', stock: 0 });
  const [newColor, setNewColor] = useState({ name: '', code: '#000000', images: [] });
  const [newTag, setNewTag] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories({ limit: 100, status: 'active' });
      setCategoriesList(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await productService.getProduct(id);
      const product = response.data.data;
      
      // Handle categories - extract IDs if populated objects
      let categoryIds = [];
      if (product.categories && product.categories.length > 0) {
        categoryIds = product.categories.map(cat => 
          typeof cat === 'object' ? cat._id : cat
        );
      }
      
      setFormData({
        productName: product.productName || '',
        price: product.price || '',
        buyPrice: product.buyPrice || '',
        shortDescription: product.shortDescription || '',
        longDescription: product.longDescription || '',
        rating: product.rating || 0,
        inventory: product.inventory || { currentStock: 0, lowStockThreshold: 10 },
        hasVariations: product.hasVariations || false,
        variations: product.variations || [],
        hasColors: product.hasColors || false,
        colors: product.colors || [],
        tags: product.tags || [],
        categories: categoryIds,
        primaryCategory: product.primaryCategory?._id || product.primaryCategory || '',
        brand: product.brand || '',
        weight: product.weight || { value: '', unit: 'kg' },
        dimensions: product.dimensions || { length: '', width: '', height: '', unit: 'cm' },
        status: product.status || 'draft',
        isPublished: product.isPublished || false,
        isFeatured: product.isFeatured || false,
        youtubeVideoUrl: product.youtubeVideoUrl || ''
      });
      setSelectedCategoryIds(categoryIds);
      setPreviewImages(product.gallery || []);
    } catch (error) {
      toast.error('Failed to fetch product');
      navigate('/products');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleCategoryChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedCategoryIds(selectedOptions);
    setFormData(prev => ({
      ...prev,
      categories: selectedOptions
    }));
  };

  const handleAddVariation = () => {
    if (!newVariation.name || !newVariation.price) {
      toast.error('Please fill variation name and price');
      return;
    }
    setFormData(prev => ({
      ...prev,
      variations: [...prev.variations, { ...newVariation, sku: `VAR-${Date.now()}` }]
    }));
    setNewVariation({ name: '', price: '', buyPrice: '', stock: 0 });
  };

  const handleRemoveVariation = (index) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index)
    }));
  };

  const handleAddColor = () => {
    if (!newColor.name) {
      toast.error('Please fill color name');
      return;
    }
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, newColor]
    }));
    setNewColor({ name: '', code: '#000000', images: [] });
  };

  const handleRemoveColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [{ url: reader.result, isMain: true }, ...prev]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, { url: reader.result, isMain: false }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'variations' || key === 'colors' || key === 'tags') {
          if (formData[key] && formData[key].length > 0) {
            submitData.append(key, JSON.stringify(formData[key]));
          }
        } else if (key === 'inventory' || key === 'weight' || key === 'dimensions') {
          if (formData[key]) {
            submitData.append(key, JSON.stringify(formData[key]));
          }
        } else if (key === 'categories') {
          if (formData.categories && formData.categories.length > 0) {
            submitData.append('categories', JSON.stringify(formData.categories));
          }
        } else if (key === 'primaryCategory' && formData.primaryCategory) {
          submitData.append('primaryCategory', formData.primaryCategory);
        } else if (formData[key] !== undefined && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Append images
      if (mainImage) {
        submitData.append('mainImage', mainImage);
      }
      galleryImages.forEach(image => {
        submitData.append('gallery', image);
      });
      
      if (id) {
        await productService.updateProduct(id, submitData);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(submitData);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FiPackage },
    { id: 'description', label: 'Description', icon: FiGrid },
    { id: 'pricing', label: 'Pricing & Stock', icon: FiDollarSign },
    { id: 'variations', label: 'Variations', icon: FiBarChart2 },
    { id: 'colors', label: 'Colors', icon: FiEye },
    { id: 'media', label: 'Media', icon: FiImage },
    { id: 'seo', label: 'SEO & Tags', icon: FiTag }
  ];

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Product' : 'Create New Product'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id ? 'Update product information' : 'Add a new product to your catalog'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
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
            {id ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="productName"
                required
                value={formData.productName}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Publish immediately</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Feature this product</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
              </label>
              <select
                multiple
                value={selectedCategoryIds}
                onChange={handleCategoryChange}
                className="input-field min-h-[100px]"
                size={4}
              >
                {categoriesList.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} {cat.parentCategory ? `(Sub: ${cat.parentCategory.name || 'Parent'})` : '(Root)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple categories</p>
            </div>

            {selectedCategoryIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Category
                </label>
                <select
                  name="primaryCategory"
                  value={formData.primaryCategory}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select primary category</option>
                  {selectedCategoryIds.map(catId => {
                    const cat = categoriesList.find(c => c._id === catId);
                    return cat ? (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ) : null;
                  })}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="weight.value"
                    value={formData.weight.value}
                    onChange={handleInputChange}
                    className="input-field flex-1"
                    placeholder="Weight"
                    step="0.01"
                  />
                  <select
                    name="weight.unit"
                    value={formData.weight.unit}
                    onChange={handleInputChange}
                    className="input-field w-24"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions (L × W × H)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="number"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Length"
                  step="0.01"
                />
                <input
                  type="number"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Width"
                  step="0.01"
                />
                <input
                  type="number"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Height"
                  step="0.01"
                />
                <select
                  name="dimensions.unit"
                  value={formData.dimensions.unit}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description *
              </label>
              <textarea
                name="shortDescription"
                required
                rows="3"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Brief description of the product (max 500 characters)"
                maxLength="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.shortDescription.length}/500 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Long Description *
              </label>
              <textarea
                name="longDescription"
                required
                rows="8"
                value={formData.longDescription}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Detailed description of the product"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="youtubeVideoUrl"
                  value={formData.youtubeVideoUrl}
                  onChange={handleInputChange}
                  className="input-field flex-1"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <FiLink className="h-5 w-5 text-gray-400 self-center" />
              </div>
            </div>
          </div>
        )}

        {/* Pricing & Stock Tab - same as before */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    className="input-field pl-8"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="buyPrice"
                    required
                    value={formData.buyPrice}
                    onChange={handleInputChange}
                    className="input-field pl-8"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {!formData.hasVariations && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    name="inventory.currentStock"
                    value={formData.inventory.currentStock}
                    onChange={handleInputChange}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="inventory.lowStockThreshold"
                    value={formData.inventory.lowStockThreshold}
                    onChange={handleInputChange}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="hasVariations"
                checked={formData.hasVariations}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label className="text-sm text-gray-700">
                This product has variations (different sizes, models, etc.)
              </label>
            </div>
          </div>
        )}

        {/* Variations Tab - same as before */}
        {activeTab === 'variations' && formData.hasVariations && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Add Variation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Variation name (e.g., 128GB)"
                  value={newVariation.name}
                  onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newVariation.price}
                  onChange={(e) => setNewVariation({ ...newVariation, price: e.target.value })}
                  className="input-field"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Cost Price"
                  value={newVariation.buyPrice}
                  onChange={(e) => setNewVariation({ ...newVariation, buyPrice: e.target.value })}
                  className="input-field"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={newVariation.stock}
                  onChange={(e) => setNewVariation({ ...newVariation, stock: e.target.value })}
                  className="input-field"
                />
              </div>
              <button
                type="button"
                onClick={handleAddVariation}
                className="mt-3 btn-primary text-sm flex items-center gap-1"
              >
                <FiPlus className="h-4 w-4" />
                Add Variation
              </button>
            </div>

            {formData.variations.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.variations.map((variation, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm">{variation.name}</td>
                        <td className="px-4 py-3 text-sm">${variation.price}</td>
                        <td className="px-4 py-3 text-sm">${variation.buyPrice}</td>
                        <td className="px-4 py-3 text-sm">{variation.stock}</td>
                        <td className="px-4 py-3 text-sm font-mono text-xs">{variation.sku}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariation(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Colors Tab - same as before */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Add Color</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Color name (e.g., Midnight Black)"
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  className="input-field"
                />
                <input
                  type="color"
                  value={newColor.code}
                  onChange={(e) => setNewColor({ ...newColor, code: e.target.value })}
                  className="input-field h-10"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setNewColor({ ...newColor, images: [{ file }] });
                    }
                  }}
                  className="input-field"
                />
              </div>
              <button
                type="button"
                onClick={handleAddColor}
                className="mt-3 btn-primary text-sm flex items-center gap-1"
              >
                <FiPlus className="h-4 w-4" />
                Add Color
              </button>
            </div>

            {formData.colors.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.colors.map((color, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: color.code }}
                      />
                      <span className="text-sm font-medium">{color.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(index)}
                      className="text-red-600 text-sm hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media Tab - same as before */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Product Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  className="hidden"
                  id="mainImageInput"
                />
                <label
                  htmlFor="mainImageInput"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FiUpload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload main image</span>
                  <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryChange}
                  className="hidden"
                  id="galleryInput"
                />
                <label
                  htmlFor="galleryInput"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FiUpload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload gallery images</span>
                  <span className="text-xs text-gray-500">You can select multiple images</span>
                </label>
              </div>
            </div>

            {previewImages.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Image Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`Preview ${index}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {img.isMain && (
                        <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO & Tags Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="input-field flex-1"
                  placeholder="Add tags (e.g., electronics, wireless)"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (0-5)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="input-field w-32"
                  step="0.1"
                  min="0"
                  max="5"
                />
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(formData.rating) ? 'fill-current' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default ProductForm;