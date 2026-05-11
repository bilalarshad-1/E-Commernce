import React, { useState, useEffect, useRef } from 'react';
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
  FiLink,
  FiFolder,
  FiCamera,
  FiRotateCw,
  FiPrinter,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiAlertCircle
} from 'react-icons/fi';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(id ? true : false);
  const [activeTab, setActiveTab] = useState('basic');
  const [categoriesList, setCategoriesList] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    buyPrice: '',
    shortDescription: '',
    longDescription: '',
    rating: 0,
    inventory: {
      currentStock: 0,
      lowStockThreshold: 10,
      reservedStock: 0
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
    youtubeVideoUrl: '',
    barcode: { number: '', format: 'CODE128' },
    qrCode: { data: '' }
  });
  
  const [mainImage, setMainImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [newVariation, setNewVariation] = useState({ name: '', price: '', buyPrice: '', stock: 0, sku: '' });
  const [newColor, setNewColor] = useState({ name: '', code: '#000000', images: [] });
  const [newTag, setNewTag] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState(null);
  const [generatedQR, setGeneratedQR] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories({ limit: 100, status: 'active' });
      setCategoriesList(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await productService.getProduct(id);
      const product = response.data.data;
      
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
        inventory: product.inventory || { currentStock: 0, lowStockThreshold: 10, reservedStock: 0 },
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
        youtubeVideoUrl: product.youtubeVideoUrl || '',
        barcode: product.barcode || { number: '', format: 'CODE128' },
        qrCode: product.qrCode || { data: '' }
      });
      setSelectedCategoryIds(categoryIds);
      setPreviewImages(product.gallery || []);
      if (product.mainImage) {
        setPreviewImages(prev => [{ url: product.mainImage.url, isMain: true }, ...prev]);
      }
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

  const handleBarcodeScan = async () => {
    if (!barcodeInput) {
      toast.error('Please enter or scan a barcode');
      return;
    }
    
    try {
      // Check if barcode already exists
      const response = await productService.getProductByBarcode(barcodeInput);
      if (response.data.data) {
        toast.error('Barcode already exists for another product');
      }
    } catch (error) {
      // Barcode not found, can use it
      setFormData(prev => ({
        ...prev,
        barcode: { ...prev.barcode, number: barcodeInput }
      }));
      toast.success('Barcode added successfully');
      setShowBarcodeModal(false);
      setBarcodeInput('');
    }
  };

  const handleGenerateBarcode = () => {
    const prefix = 'PROD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newBarcode = `${prefix}${timestamp}${random}`;
    setFormData(prev => ({
      ...prev,
      barcode: { ...prev.barcode, number: newBarcode }
    }));
    toast.success('Barcode generated successfully');
    setShowBarcodeModal(false);
  };

  const handlePrintBarcode = () => {
    if (!formData.barcode.number) {
      toast.error('No barcode to print');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode</title>
          <style>
            body { font-family: Arial; padding: 20px; text-align: center; }
            .barcode { font-family: monospace; font-size: 24px; letter-spacing: 2px; margin: 20px; }
            .product-name { font-size: 14px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="barcode">*${formData.barcode.number}*</div>
          <div class="product-name">${formData.productName || 'Product'}</div>
          <script>window.print();setTimeout(function(){window.close();},500);<\/script>
        </body>
      </html>
    `);
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
    const sku = newVariation.sku || `VAR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    setFormData(prev => ({
      ...prev,
      variations: [...prev.variations, { ...newVariation, sku, stock: newVariation.stock || 0 }]
    }));
    setNewVariation({ name: '', price: '', buyPrice: '', stock: 0, sku: '' });
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
        setPreviewImages(prev => [{ url: reader.result, isMain: true }, ...prev.filter(img => !img.isMain)]);
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

  const removePreviewImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    if (previewImages[index]?.isMain) {
      setMainImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'variations' || key === 'colors' || key === 'tags') {
          if (formData[key] && formData[key].length > 0) {
            submitData.append(key, JSON.stringify(formData[key]));
          }
        } else if (key === 'inventory' || key === 'weight' || key === 'dimensions' || key === 'barcode' || key === 'qrCode') {
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
    { id: 'barcode_qr', label: 'Barcode & QR', icon: FiBarcode },
    { id: 'media', label: 'Media', icon: FiImage },
    { id: 'tags', label: 'Tags & SEO', icon: FiTag }
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
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-2 min-w-max">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                required
                value={formData.productName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Publish immediately</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px]"
                size={4}
              >
                {categoriesList.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} {cat.parentCategory ? `(Subcategory)` : '(Main Category)'}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Weight"
                    step="0.01"
                  />
                  <select
                    name="weight.unit"
                    value={formData.weight.unit}
                    onChange={handleInputChange}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Length"
                  step="0.01"
                />
                <input
                  type="number"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Width"
                  step="0.01"
                />
                <input
                  type="number"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Height"
                  step="0.01"
                />
                <select
                  name="dimensions.unit"
                  value={formData.dimensions.unit}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="shortDescription"
                required
                rows="3"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Brief description of the product (max 500 characters)"
                maxLength="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.shortDescription.length}/500 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Long Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="longDescription"
                required
                rows="8"
                value={formData.longDescription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <FiLink className="h-5 w-5 text-gray-400 self-center" />
              </div>
            </div>
          </div>
        )}

        {/* Pricing & Stock Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="buyPrice"
                    required
                    value={formData.buyPrice}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {!formData.hasVariations && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      name="inventory.currentStock"
                      value={formData.inventory.currentStock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reserved Stock
                    </label>
                    <input
                      type="number"
                      name="inventory.reservedStock"
                      value={formData.inventory.reservedStock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  <FiInfo className="inline mr-1" />
                  Available Stock: {formData.inventory.currentStock - formData.inventory.reservedStock}
                </div>
              </>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                name="hasVariations"
                checked={formData.hasVariations}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label className="text-sm text-gray-700">
                This product has variations (different sizes, models, etc.)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="hasColors"
                checked={formData.hasColors}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label className="text-sm text-gray-700">
                This product has color variants
              </label>
            </div>
          </div>
        )}

        {/* Variations Tab */}
        {activeTab === 'variations' && (
          <div className="space-y-5">
            {!formData.hasVariations ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Enable variations in the Pricing tab first</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Add Variation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                      type="text"
                      placeholder="Variation name *"
                      value={newVariation.name}
                      onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      placeholder="Price *"
                      value={newVariation.price}
                      onChange={(e) => setNewVariation({ ...newVariation, price: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Cost Price"
                      value={newVariation.buyPrice}
                      onChange={(e) => setNewVariation({ ...newVariation, buyPrice: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={newVariation.stock}
                      onChange={(e) => setNewVariation({ ...newVariation, stock: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="SKU (optional)"
                      value={newVariation.sku}
                      onChange={(e) => setNewVariation({ ...newVariation, sku: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariation}
                    className="mt-3 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-primary-700"
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Variation
                  </button>
                </div>

                {formData.variations.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
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
                            <td className="px-4 py-3 text-sm font-mono text-xs">{variation.sku || '-'}</td>
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
              </>
            )}
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-5">
            {!formData.hasColors ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Enable colors in the Pricing tab first</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Add Color</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Color name (e.g., Midnight Black)"
                      value={newColor.name}
                      onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="color"
                      value={newColor.code}
                      onChange={(e) => setNewColor({ ...newColor, code: e.target.value })}
                      className="h-10 px-2 py-1 border border-gray-300 rounded-lg"
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
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="mt-3 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-primary-700"
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
              </>
            )}
          </div>
        )}

        {/* Barcode & QR Tab */}
        {activeTab === 'barcode_qr' && (
          <div className="space-y-6">
            {/* Barcode Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiBarcode className="h-5 w-5 text-primary-600" />
                  Barcode
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBarcodeModal(true)}
                    className="text-sm bg-primary-50 text-primary-600 px-3 py-1 rounded-lg hover:bg-primary-100"
                  >
                    Generate/Scan
                  </button>
                  {formData.barcode.number && (
                    <button
                      type="button"
                      onClick={handlePrintBarcode}
                      className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200"
                    >
                      <FiPrinter className="h-4 w-4 inline mr-1" />
                      Print
                    </button>
                  )}
                </div>
              </div>
              
              {formData.barcode.number ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="font-mono text-2xl tracking-wider mb-2">
                    *{formData.barcode.number}*
                  </div>
                  <p className="text-sm text-gray-500">Format: {formData.barcode.format}</p>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FiBarcode className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No barcode assigned</p>
                  <p className="text-sm">Click "Generate/Scan" to add a barcode</p>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiQrCode className="h-5 w-5 text-primary-600" />
                  QR Code
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQRModal(true)}
                    className="text-sm bg-primary-50 text-primary-600 px-3 py-1 rounded-lg hover:bg-primary-100"
                  >
                    Generate QR
                  </button>
                </div>
              </div>
              
              {formData.qrCode.data ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="inline-block p-3 bg-white rounded-lg">
                    <img 
                      src={formData.qrCode.imageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formData.qrCode.data)}`}
                      alt="QR Code"
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 break-all">{formData.qrCode.data}</p>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FiQrCode className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No QR code generated</p>
                  <p className="text-sm">Click "Generate QR" to create a QR code for this product</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barcode Modal */}
        {showBarcodeModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowBarcodeModal(false)} />
              <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4">Barcode Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enter or Scan Barcode
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        placeholder="Scan or type barcode"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleBarcodeScan}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                      >
                        <FiScan className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <FiRotateCw className="h-4 w-4" />
                    Generate Random Barcode
                  </button>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowBarcodeModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowQRModal(false)} />
              <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4">Generate QR Code</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QR Data / URL
                    </label>
                    <input
                      type="text"
                      value={formData.qrCode.data || `${window.location.origin}/product/${id || 'new'}`}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        qrCode: { ...prev.qrCode, data: e.target.value }
                      }))}
                      placeholder="Enter URL or text for QR code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {formData.qrCode.data && (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formData.qrCode.data)}`}
                        alt="QR Code Preview"
                        className="w-32 h-32 mx-auto"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      toast.success('QR code data saved');
                      setShowQRModal(false);
                    }}
                    className="btn-primary flex-1"
                  >
                    Save QR Data
                  </button>
                  <button onClick={() => setShowQRModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Product Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
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
                  <FiUpload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload main image</span>
                  <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
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
                  <FiUpload className="h-10 w-10 text-gray-400 mb-2" />
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
                      <button
                        type="button"
                        onClick={() => removePreviewImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiTrash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags & SEO Tab */}
        {activeTab === 'tags' && (
          <div className="space-y-5">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
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
                {formData.tags.length === 0 && (
                  <p className="text-sm text-gray-500">No tags added yet</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (0-5)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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