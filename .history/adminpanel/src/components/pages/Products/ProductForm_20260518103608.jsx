// pages/products/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService, categoryService } from '../../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSave, FiX, FiPlus, FiTrash2, FiImage, FiVideo, FiTag,
  FiPackage, FiDollarSign, FiGrid, FiEye, FiBarChart2,
  FiUpload, FiLink, FiFolder, FiInfo, FiAlertCircle,
  FiPrinter, FiDownload, FiCopy, FiCheck, FiStar, FiTrendingUp,
  FiAward, FiHeart, FiCalendar, FiClock, FiUser, FiRefreshCw,
  FiZoomIn, FiZoomOut, FiRotateCw, FiScissors, FiClipboard, BiBarcode
} from 'react-icons/fi';
import { BiBarcode, BiQr } from 'react-icons/bi';
import { MdQrCodeScanner } from 'react-icons/md';
import { BsUpcScan } from 'react-icons/bs';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(id ? true : false);
  const [activeTab, setActiveTab] = useState('basic');
  const [categoriesList, setCategoriesList] = useState([]);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(null);
  const [previewMainImage, setPreviewMainImage] = useState(null);
  const [previewGalleryImages, setPreviewGalleryImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  
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
    isHotSale: false,
    isTopRated: false,
    youtubeVideoUrl: '',
    barcode: { number: '', format: 'CODE128' },
    qrCode: { data: '' }
  });
  
  const [mainImage, setMainImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [newVariation, setNewVariation] = useState({ 
    name: '', 
    price: '', 
    buyPrice: '', 
    stock: 0, 
    sku: '',
    barcode: { number: '' },
    qrCode: { data: '' }
  });
  const [newColor, setNewColor] = useState({ 
    name: '', 
    code: '#000000', 
    stock: 0,
    sku: '',
    images: [] 
  });
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
        isHotSale: product.isHotSale || false,
        isTopRated: product.isTopRated || false,
        youtubeVideoUrl: product.youtubeVideoUrl || '',
        barcode: product.barcode || { number: '', format: 'CODE128' },
        qrCode: product.qrCode || { data: '' }
      });
      setSelectedCategoryIds(categoryIds);
      
      // Set existing images
      const images = [];
      if (product.mainImage) {
        images.push({ url: product.mainImage.url, publicId: product.mainImage.publicId, isMain: true });
      }
      if (product.gallery && product.gallery.length > 0) {
        product.gallery.forEach(img => {
          images.push({ url: img.url, publicId: img.publicId, isMain: false, caption: img.caption });
        });
      }
      setExistingImages(images);
      
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

  const handleCopyBarcode = () => {
    if (formData.barcode.number) {
      navigator.clipboard.writeText(formData.barcode.number);
      setCopiedBarcode(formData.barcode.number);
      toast.success('Barcode copied to clipboard');
      setTimeout(() => setCopiedBarcode(null), 2000);
    }
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
          <title>Barcode - ${formData.productName}</title>
          <style>
            body { font-family: 'Courier New', monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
            .barcode-card { background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .barcode-number { font-size: 36px; letter-spacing: 4px; margin: 20px 0; font-weight: bold; }
            .product-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .price { font-size: 24px; font-weight: bold; color: #2563eb; margin: 10px 0; }
            @media print { body { background: white; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="barcode-card">
            <div class="product-name">${formData.productName || 'Product'}</div>
            <div class="barcode-number">*${formData.barcode.number}*</div>
            <div class="price">$${formData.price}</div>
            <div class="no-print" style="margin-top: 30px;">
              <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Close</button>
            </div>
          </div>
          <script>window.print();setTimeout(()=>window.close(),500);</script>
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
      variations: [...prev.variations, { 
        ...newVariation, 
        sku, 
        stock: parseInt(newVariation.stock) || 0,
        price: parseFloat(newVariation.price),
        buyPrice: parseFloat(newVariation.buyPrice) || 0,
        barcode: { number: newVariation.barcode?.number || `VAR-${Date.now()}` },
        qrCode: { data: newVariation.qrCode?.data || '' }
      }]
    }));
    setNewVariation({ name: '', price: '', buyPrice: '', stock: 0, sku: '', barcode: { number: '' }, qrCode: { data: '' } });
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
      colors: [...prev.colors, { 
        ...newColor, 
        stock: parseInt(newColor.stock) || 0,
        sku: newColor.sku || `CLR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      }]
    }));
    setNewColor({ name: '', code: '#000000', stock: 0, sku: '', images: [] });
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
        setPreviewMainImage(reader.result);
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
        setPreviewGalleryImages(prev => [...prev, { url: reader.result, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index, publicId) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    if (publicId) {
      setImagesToDelete(prev => [...prev, publicId]);
    }
  };

  const removePreviewImage = (index, isMain = false) => {
    if (isMain) {
      setPreviewMainImage(null);
      setMainImage(null);
    } else {
      setPreviewGalleryImages(prev => prev.filter((_, i) => i !== index));
      setGalleryImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Append basic fields
      const fieldsToSend = {
        productName: formData.productName,
        price: formData.price,
        buyPrice: formData.buyPrice,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        rating: formData.rating,
        inventory: formData.inventory,
        hasVariations: formData.hasVariations,
        hasColors: formData.hasColors,
        brand: formData.brand,
        weight: formData.weight,
        dimensions: formData.dimensions,
        status: formData.status,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        isHotSale: formData.isHotSale,
        isTopRated: formData.isTopRated,
        youtubeVideoUrl: formData.youtubeVideoUrl,
        barcode: formData.barcode,
        qrCode: formData.qrCode,
        tags: formData.tags,
        categories: formData.categories,
        primaryCategory: formData.primaryCategory
      };
      
      // Handle variations (send as JSON string)
      if (formData.hasVariations && formData.variations.length > 0) {
        submitData.append('variations', JSON.stringify(formData.variations));
      }
      
      // Handle colors (send as JSON string)
      if (formData.hasColors && formData.colors.length > 0) {
        submitData.append('colors', JSON.stringify(formData.colors));
      }
      
      // Handle tags (send as JSON string)
      if (formData.tags.length > 0) {
        submitData.append('tags', JSON.stringify(formData.tags));
      }
      
      // Handle categories (send as JSON string)
      if (formData.categories.length > 0) {
        submitData.append('categories', JSON.stringify(formData.categories));
      }
      
      // Handle primary category
      if (formData.primaryCategory) {
        submitData.append('primaryCategory', formData.primaryCategory);
      }
      
      // Handle inventory
      submitData.append('inventory', JSON.stringify(formData.inventory));
      
      // Handle weight
      submitData.append('weight', JSON.stringify(formData.weight));
      
      // Handle dimensions
      submitData.append('dimensions', JSON.stringify(formData.dimensions));
      
      // Handle barcode
      if (formData.barcode.number) {
        submitData.append('barcode', JSON.stringify(formData.barcode));
      }
      
      // Handle QR code
      if (formData.qrCode.data) {
        submitData.append('qrCode', JSON.stringify(formData.qrCode));
      }
      
      // Append other scalar fields
      Object.keys(fieldsToSend).forEach(key => {
        if (fieldsToSend[key] !== undefined && fieldsToSend[key] !== '' && 
            typeof fieldsToSend[key] !== 'object' && key !== 'inventory' && 
            key !== 'weight' && key !== 'dimensions' && key !== 'barcode' && 
            key !== 'qrCode' && key !== 'variations' && key !== 'colors' && 
            key !== 'tags' && key !== 'categories') {
          submitData.append(key, fieldsToSend[key]);
        }
      });
      
      // Append images
      if (mainImage) {
        submitData.append('mainImage', mainImage);
      }
      galleryImages.forEach(image => {
        submitData.append('gallery', image);
      });
      
      // Append images to delete
      if (imagesToDelete.length > 0) {
        submitData.append('deleteImages', JSON.stringify(imagesToDelete));
      }
      
      if (id) {
        await productService.updateProduct(id, submitData);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(submitData);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (error) {
      console.error('Submit error:', error);
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
    { id: 'barcode_qr', label: 'Barcode & QR', icon: BiBarcode },
    { id: 'media', label: 'Media', icon: FiImage },
    { id: 'tags', label: 'Tags & SEO', icon: FiTag },
    { id: 'flags', label: 'Flags', icon: FiStar }
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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
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
            className="btn-secondary flex items-center gap-2 transition-all hover:scale-105"
          >
            <FiX className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 transition-all hover:scale-105"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FiSave className="h-4 w-4" />
            )}
            {id ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </motion.div>

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
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all"
                />
                <span className="text-sm text-gray-700">Publish immediately</span>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px] transition-all"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Weight"
                    step="0.01"
                  />
                  <select
                    name="weight.unit"
                    value={formData.weight.unit}
                    onChange={handleInputChange}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Length"
                  step="0.01"
                />
                <input
                  type="number"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Width"
                  step="0.01"
                />
                <input
                  type="number"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Height"
                  step="0.01"
                />
                <select
                  name="dimensions.unit"
                  value={formData.dimensions.unit}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {!formData.hasVariations && !formData.hasColors && (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all"
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
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all"
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
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <input
                      type="text"
                      placeholder="Variation name *"
                      value={newVariation.name}
                      onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <input
                      type="number"
                      placeholder="Price *"
                      value={newVariation.price}
                      onChange={(e) => setNewVariation({ ...newVariation, price: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Cost Price"
                      value={newVariation.buyPrice}
                      onChange={(e) => setNewVariation({ ...newVariation, buyPrice: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={newVariation.stock}
                      onChange={(e) => setNewVariation({ ...newVariation, stock: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={newVariation.sku}
                      onChange={(e) => setNewVariation({ ...newVariation, sku: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-primary-700 transition-all hover:scale-105"
                    >
                      <FiPlus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Barcode</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.variations.map((variation, index) => (
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
                            <td className="px-4 py-3 text-sm font-mono text-xs">{variation.sku || '-'}</td>
                            <td className="px-4 py-3 text-sm font-mono text-xs">{variation.barcode?.number || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveVariation(index)}
                                className="text-red-600 hover:text-red-800 transition-colors"
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                      type="text"
                      placeholder="Color name *"
                      value={newColor.name}
                      onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <input
                      type="color"
                      value={newColor.code}
                      onChange={(e) => setNewColor({ ...newColor, code: e.target.value })}
                      className="h-10 px-2 py-1 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={newColor.stock}
                      onChange={(e) => setNewColor({ ...newColor, stock: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={newColor.sku}
                      onChange={(e) => setNewColor({ ...newColor, sku: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-primary-700 transition-all hover:scale-105"
                    >
                      <FiPlus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
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
                        <p className="text-xs text-gray-600">Stock: {color.stock || 0}</p>
                        {color.sku && <p className="text-xs text-gray-500 font-mono">{color.sku}</p>}
                        {color.barcode?.number && <p className="text-xs text-gray-500 font-mono">Barcode: {color.barcode.number}</p>}
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(index)}
                          className="text-red-600 text-sm hover:text-red-800 mt-2 transition-colors"
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
                  <BiBarcode className="h-5 w-5 text-primary-600" />
                  Product Barcode
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBarcodeModal(true)}
                    className="text-sm bg-primary-50 text-primary-600 px-3 py-1 rounded-lg hover:bg-primary-100 transition-all"
                  >
                    Generate
                  </button>
                  {formData.barcode.number && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrintBarcode}
                        className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition-all"
                      >
                        <FiPrinter className="h-4 w-4 inline mr-1" />
                        Print
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyBarcode}
                        className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition-all"
                      >
                        {copiedBarcode === formData.barcode.number ? (
                          <FiCheck className="h-4 w-4 inline mr-1" />
                        ) : (
                          <FiCopy className="h-4 w-4 inline mr-1" />
                        )}
                        Copy
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {formData.barcode.number ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="font-mono text-2xl tracking-wider mb-2">
                    {formData.barcode.number}
                  </div>
                  <p className="text-sm text-gray-500">Format: {formData.barcode.format}</p>
                  <div className="mt-3">
                    <img 
                      src={`https://barcode.tec-it.com/barcode.ashx?data=${formData.barcode.number}&code=${formData.barcode.format}&dpi=96`}
                      alt="Barcode"
                      className="mx-auto"
                      style={{ maxWidth: '100%' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <BiBarcode className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No barcode assigned</p>
                  <p className="text-sm">Click "Generate" to add a barcode</p>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BiQr className="h-5 w-5 text-primary-600" />
                  Product QR Code
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQRModal(true)}
                    className="text-sm bg-primary-50 text-primary-600 px-3 py-1 rounded-lg hover:bg-primary-100 transition-all"
                  >
                    Generate QR
                  </button>
                </div>
              </div>
              
              {formData.qrCode.data ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="inline-block p-3 bg-white rounded-lg">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formData.qrCode.data)}`}
                      alt="QR Code"
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 break-all">{formData.qrCode.data}</p>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <BiQr className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No QR code generated</p>
                  <p className="text-sm">Click "Generate QR" to create a QR code for this product</p>
                </div>
              )}
            </div>

            {/* Variations Barcodes Summary */}
            {formData.hasVariations && formData.variations.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiBarcode className="h-5 w-5 text-primary-600" />
                  Variations Barcodes
                </h3>
                <div className="space-y-2">
                  {formData.variations.map((variation, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{variation.name}</span>
                      <span className="font-mono text-xs">{variation.barcode?.number || 'Not generated'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Colors Barcodes Summary */}
            {formData.hasColors && formData.colors.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiBarcode className="h-5 w-5 text-primary-600" />
                  Colors Barcodes
                </h3>
                <div className="space-y-2">
                  {formData.colors.map((color, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.code }} />
                        <span className="text-sm">{color.name}</span>
                      </div>
                      <span className="font-mono text-xs">{color.barcode?.number || 'Not generated'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Product Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-all">
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
              {previewMainImage && (
                <div className="mt-3 relative w-32 h-32">
                  <img src={previewMainImage} alt="Main preview" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePreviewImage(0, true)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-all">
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

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Existing Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img.url} alt={`Existing ${index}`} className="w-full h-32 object-cover rounded-lg" />
                      {img.isMain && (
                        <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">Main</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index, img.publicId)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <FiTrash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Gallery Previews */}
            {previewGalleryImages.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">New Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewGalleryImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img.url} alt={`Preview ${index}`} className="w-full h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removePreviewImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="Add tags (e.g., electronics, wireless)"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn-secondary transition-all hover:scale-105"
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
                      className="hover:text-red-600 transition-colors"
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
                Initial Rating (0-5)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
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
              <p className="text-xs text-gray-500 mt-1">Rating will be updated automatically as customers review the product</p>
            </div>
          </div>
        )}

        {/* Flags Tab */}
        {activeTab === 'flags' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <FiStar className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Featured Product</span>
                  </div>
                  <p className="text-sm text-gray-500">Display this product on the featured section</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="checkbox"
                  name="isHotSale"
                  checked={formData.isHotSale}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <FiTrendingUp className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Hot Sale</span>
                  </div>
                  <p className="text-sm text-gray-500">Mark as trending/hot sale product</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="checkbox"
                  name="isTopRated"
                  checked={formData.isTopRated}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <FiAward className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Top Rated</span>
                  </div>
                  <p className="text-sm text-gray-500">Mark as top rated product (auto-updates with rating)</p>
                </div>
              </label>
            </div>

            {formData.rating >= 4.5 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-purple-700 flex items-center gap-2">
                  <FiAward className="h-5 w-5" />
                  This product qualifies as Top Rated (Rating: {formData.rating})
                </p>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                <FiInfo className="inline mr-1" />
                The "Top Rated" flag is automatically set when product rating reaches 4.5 or higher.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Barcode Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowBarcodeModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Generate Barcode</h3>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
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
    </form>
  );
};

export default ProductForm;