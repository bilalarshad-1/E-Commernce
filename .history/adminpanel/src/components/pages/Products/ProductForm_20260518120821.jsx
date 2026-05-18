import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService, categoryService } from '../../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSave, FiX, FiPlus, FiTrash2, FiImage, FiVideo, FiTag,
  FiPackage, FiDollarSign, FiGrid, FiEye, FiBarChart2,
  FiUpload, FiLink, FiFolder, FiInfo, FiAlertCircle,
  FiStar, FiTrendingUp, FiAward, FiHeart, FiCamera,
  FiChevronDown, FiChevronUp, FiEdit2, FiPlusCircle,
  FiZoomIn, FiZoomOut, FiMove, FiGripVertical, FiSettings,
  FiSearch, FiHome, FiCopy, FiCheck, FiRefreshCw
} from 'react-icons/fi';
iimport { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [activeTab, setActiveTab] = useState('basic');
  const [categoriesList, setCategoriesList] = useState([]);
  const [previewMainImage, setPreviewMainImage] = useState(null);
  const [previewGalleryImages, setPreviewGalleryImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [colorImageUploading, setColorImageUploading] = useState(null);
  const [expandedColorIndex, setExpandedColorIndex] = useState(null);
  const [expandedVariationIndex, setExpandedVariationIndex] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewsStats, setReviewsStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    buyPrice: '',
    shortDescription: '',
    longDescription: '',
    rating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
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
    mainImage: null,
    gallery: [],
    thumbnailImage: null,
    hoverImage: null,
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonicalUrl: ''
    }
  });
  
  const [mainImageFile, setMainImageFile] = useState(null);
  const [thumbnailImageFile, setThumbnailImageFile] = useState(null);
  const [hoverImageFile, setHoverImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [newVariation, setNewVariation] = useState({ 
    name: '', 
    price: '', 
    buyPrice: '', 
    sku: ''
  });
  const [newColor, setNewColor] = useState({ 
    name: '', 
    code: '#000000',
    sku: '',
    images: [] 
  });
  const [newTag, setNewTag] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [metaKeywordInput, setMetaKeywordInput] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchProduct();
      fetchProductReviews();
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

  const fetchProductReviews = async () => {
    try {
      const response = await productService.getProductReviews?.(id, { limit: 100 });
      if (response?.data?.data) {
        const reviews = response.data.data;
        setProductReviews(reviews);
        
        const stats = {
          totalReviews: reviews.length,
          averageRating: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        
        if (reviews.length > 0) {
          let sum = 0;
          reviews.forEach(review => {
            sum += review.rating;
            stats.distribution[review.rating] = (stats.distribution[review.rating] || 0) + 1;
          });
          stats.averageRating = sum / reviews.length;
        }
        setReviewsStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
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
        totalReviews: product.totalReviews || 0,
        ratingDistribution: product.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
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
        mainImage: product.mainImage || null,
        gallery: product.gallery || [],
        thumbnailImage: product.thumbnailImage || null,
        hoverImage: product.hoverImage || null,
        seo: product.seo || {
          metaTitle: '',
          metaDescription: '',
          metaKeywords: [],
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          twitterCard: 'summary_large_image',
          twitterTitle: '',
          twitterDescription: '',
          twitterImage: '',
          canonicalUrl: ''
        }
      });
      setSelectedCategoryIds(categoryIds);
      if (product.seo?.metaKeywords?.length) {
        setMetaKeywordInput(product.seo.metaKeywords.join(', '));
      }
      
      // Set existing images
      const images = [];
      if (product.mainImage) {
        images.push({ url: product.mainImage.url, publicId: product.mainImage.publicId, isMain: true, type: 'main' });
      }
      if (product.gallery && product.gallery.length > 0) {
        product.gallery.forEach(img => {
          images.push({ url: img.url, publicId: img.publicId, isMain: img.isMain || false, caption: img.caption, alt: img.alt, order: img.order, type: 'gallery' });
        });
      }
      if (product.thumbnailImage) {
        images.push({ url: product.thumbnailImage.url, publicId: product.thumbnailImage.publicId, type: 'thumbnail' });
      }
      if (product.hoverImage) {
        images.push({ url: product.hoverImage.url, publicId: product.hoverImage.publicId, type: 'hover' });
      }
      setExistingImages(images);
      
    } catch (error) {
      console.error('Fetch product error:', error);
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
    } else if (name.includes('seo.')) {
      const seoField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        seo: { ...prev.seo, [seoField]: value }
      }));
    } else if (name === 'metaKeywords') {
      setMetaKeywordInput(value);
      const keywords = value.split(',').map(k => k.trim()).filter(k => k);
      setFormData(prev => ({
        ...prev,
        seo: { ...prev.seo, metaKeywords: keywords }
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

  // Variation handlers
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
        price: parseFloat(newVariation.price),
        buyPrice: parseFloat(newVariation.buyPrice) || 0
      }]
    }));
    setNewVariation({ name: '', price: '', buyPrice: '', sku: '' });
  };

  const handleRemoveVariation = (index) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateVariation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((v, i) => 
        i === index ? { ...v, [field]: field === 'price' || field === 'buyPrice' ? parseFloat(value) : value } : v
      )
    }));
  };

  // Color handlers
  const handleAddColor = () => {
    if (!newColor.name) {
      toast.error('Please fill color name');
      return;
    }
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { 
        ...newColor, 
        sku: newColor.sku || `CLR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        images: []
      }]
    }));
    setNewColor({ name: '', code: '#000000', sku: '', images: [] });
  };

  const handleRemoveColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateColor = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      )
    }));
  };

  // Color image handlers
  const handleColorImageUpload = async (colorIndex, files) => {
    if (!files || files.length === 0) return;
    
    setColorImageUploading(colorIndex);
    
    const formDataUpload = new FormData();
    Array.from(files).forEach(file => {
      formDataUpload.append('images', file);
    });
    
    try {
      const colorId = formData.colors[colorIndex]._id || `temp-${colorIndex}`;
      const response = await productService.uploadColorImages(id, colorId, formDataUpload);
      const uploadedImages = response.data.data || response.data.images || [];
      
      setFormData(prev => {
        const updatedColors = [...prev.colors];
        updatedColors[colorIndex] = {
          ...updatedColors[colorIndex],
          images: [...(updatedColors[colorIndex].images || []), ...uploadedImages]
        };
        return { ...prev, colors: updatedColors };
      });
      
      toast.success(`Uploaded ${uploadedImages.length} image(s) for color`);
    } catch (error) {
      console.error('Color upload error:', error);
      toast.error('Failed to upload color images');
    } finally {
      setColorImageUploading(null);
    }
  };

  const handleRemoveColorImage = (colorIndex, imageId) => {
    setFormData(prev => {
      const updatedColors = [...prev.colors];
      updatedColors[colorIndex].images = updatedColors[colorIndex].images.filter(img => img._id !== imageId);
      return { ...prev, colors: updatedColors };
    });
    toast.success('Image removed');
  };

  const handleSetMainColorImage = (colorIndex, imageId) => {
    setFormData(prev => {
      const updatedColors = [...prev.colors];
      updatedColors[colorIndex].images = updatedColors[colorIndex].images.map(img => ({
        ...img,
        isMain: img._id === imageId
      }));
      return { ...prev, colors: updatedColors };
    });
    toast.success('Main image updated');
  };

  // Tag handlers
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

  // Image handlers
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewMainImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThumbnailImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = { url: reader.result, file };
        setFormData(prev => ({ ...prev, thumbnailImage: preview }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = { url: reader.result, file };
        setFormData(prev => ({ ...prev, hoverImage: preview }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewGalleryImages(prev => [...prev, { url: reader.result, file, order: prev.length }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index, publicId, type) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    if (publicId) {
      setImagesToDelete(prev => [...prev, { publicId, type }]);
    }
    
    if (type === 'main') {
      setFormData(prev => ({ ...prev, mainImage: null }));
      setMainImageFile(null);
      setPreviewMainImage(null);
    } else if (type === 'thumbnail') {
      setFormData(prev => ({ ...prev, thumbnailImage: null }));
      setThumbnailImageFile(null);
    } else if (type === 'hover') {
      setFormData(prev => ({ ...prev, hoverImage: null }));
      setHoverImageFile(null);
    }
  };

  const removePreviewImage = (index, isMain = false) => {
    if (isMain) {
      setPreviewMainImage(null);
      setMainImageFile(null);
    } else {
      setPreviewGalleryImages(prev => prev.filter((_, i) => i !== index));
      setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(previewGalleryImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order property
    const reorderedWithOrder = items.map((item, idx) => ({ ...item, order: idx }));
    setPreviewGalleryImages(reorderedWithOrder);
    
    // Also reorder galleryFiles
    const files = Array.from(galleryFiles);
    const [reorderedFile] = files.splice(result.source.index, 1);
    files.splice(result.destination.index, 0, reorderedFile);
    setGalleryFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Basic fields
      const basicFields = {
        productName: formData.productName,
        price: formData.price,
        buyPrice: formData.buyPrice,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        brand: formData.brand,
        status: formData.status,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        isHotSale: formData.isHotSale,
        isTopRated: formData.isTopRated,
        hasVariations: formData.hasVariations,
        hasColors: formData.hasColors,
        youtubeVideoUrl: formData.youtubeVideoUrl
      };
      
      Object.keys(basicFields).forEach(key => {
        if (basicFields[key] !== undefined && basicFields[key] !== '') {
          submitData.append(key, basicFields[key]);
        }
      });
      
      // Weight and dimensions
      submitData.append('weight', JSON.stringify(formData.weight));
      submitData.append('dimensions', JSON.stringify(formData.dimensions));
      
      // SEO
      submitData.append('seo', JSON.stringify(formData.seo));
      
      // Variations
      if (formData.hasVariations && formData.variations.length > 0) {
        submitData.append('variations', JSON.stringify(formData.variations));
      }
      
      // Colors (without images as they're handled separately)
      if (formData.hasColors && formData.colors.length > 0) {
        const colorsToSend = formData.colors.map(color => ({
          name: color.name,
          code: color.code,
          sku: color.sku,
          images: color.images || []
        }));
        submitData.append('colors', JSON.stringify(colorsToSend));
      }
      
      // Tags
      if (formData.tags.length > 0) {
        submitData.append('tags', JSON.stringify(formData.tags));
      }
      
      // Categories
      if (formData.categories.length > 0) {
        submitData.append('categories', JSON.stringify(formData.categories));
      }
      if (formData.primaryCategory) {
        submitData.append('primaryCategory', formData.primaryCategory);
      }
      
      // Images
      if (mainImageFile) {
        submitData.append('mainImage', mainImageFile);
        if (formData.mainImage?.alt) submitData.append('mainImageAlt', formData.mainImage.alt);
        if (formData.mainImage?.caption) submitData.append('mainImageCaption', formData.mainImage.caption);
      }
      
      if (thumbnailImageFile) {
        submitData.append('thumbnailImage', thumbnailImageFile);
        if (formData.thumbnailImage?.alt) submitData.append('thumbnailAlt', formData.thumbnailImage.alt);
      }
      
      if (hoverImageFile) {
        submitData.append('hoverImage', hoverImageFile);
        if (formData.hoverImage?.alt) submitData.append('hoverImageAlt', formData.hoverImage.alt);
      }
      
      galleryFiles.forEach((file, index) => {
        submitData.append('gallery', file);
      });
      
      // Gallery metadata
      if (galleryFiles.length > 0) {
        const galleryAlts = previewGalleryImages.map(img => img.alt || '');
        const galleryCaptions = previewGalleryImages.map(img => img.caption || '');
        submitData.append('galleryAlts', JSON.stringify(galleryAlts));
        submitData.append('galleryCaptions', JSON.stringify(galleryCaptions));
      }
      
      // Images to delete
      if (imagesToDelete.length > 0) {
        submitData.append('deleteImages', JSON.stringify(imagesToDelete));
      }
      
      if (id) {
        await productService.updateProduct(id, submitData);
        toast.success('Product updated successfully');
      } else {
        const response = await productService.createProduct(submitData);
        toast.success('Product created successfully');
        if (response.data.data?._id) {
          navigate(`/products/${response.data.data._id}`);
          return;
        }
      }
      navigate('/products');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  // Preview generation
  const generatePreview = () => {
    const previewUrl = `${window.location.origin}/product/${formData.slug || id || 'preview'}`;
    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">Google Search Preview</p>
          <div className="space-y-1">
            <p className="text-blue-800 text-lg font-medium hover:underline cursor-pointer">
              {formData.seo.metaTitle || formData.productName || 'Product Title'}
            </p>
            <p className="text-green-700 text-sm">{previewUrl}</p>
            <p className="text-gray-600 text-sm">
              {formData.seo.metaDescription || formData.shortDescription?.substring(0, 160) || 'No description available'}
            </p>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">Social Media Preview (Facebook/LinkedIn)</p>
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-300 rounded flex items-center justify-center">
              {formData.seo.ogImage ? (
                <img src={formData.seo.ogImage} alt="OG" className="w-full h-full object-cover rounded" />
              ) : (
                <FiImage className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-gray-500 text-xs uppercase">example.com</p>
              <p className="font-medium text-gray-900">{formData.seo.ogTitle || formData.productName}</p>
              <p className="text-gray-600 text-sm">{formData.seo.ogDescription || formData.shortDescription}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRatingStars = (rating, size = "h-4 w-4") => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`${size} ${
              star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FiPackage, description: 'Product name, categories, brand' },
    { id: 'description', label: 'Description', icon: FiGrid, description: 'Product details & specifications' },
    { id: 'pricing', label: 'Pricing', icon: FiDollarSign, description: 'Price, cost, and flags' },
    { id: 'variations', label: 'Variations', icon: FiBarChart2, description: 'Size, model variants' },
    { id: 'colors', label: 'Colors & Images', icon: FiCamera, description: 'Color variants with images' },
    { id: 'media', label: 'Media', icon: FiImage, description: 'Main, gallery, thumbnail images' },
    { id: 'seo', label: 'SEO', icon: FiSearch, description: 'Meta tags & social preview' },
    { id: 'reviews', label: 'Reviews', icon: FiStar, description: 'Customer reviews & ratings' },
    { id: 'flags', label: 'Flags', icon: FiAward, description: 'Featured, hot sale badges' }
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
            {id ? 'Update product information, images, and settings' : 'Add a new product to your catalog with images and variations'}
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
        <nav className="flex gap-1 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <p className="text-xs text-gray-500 mt-1">This will be used as the product title and generate the URL slug</p>
              </div>

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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categories
                </label>
                <select
                  multiple
                  value={selectedCategoryIds}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[120px] transition-all"
                  size={5}
                >
                  {categoriesList.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} {cat.parentCategory ? `(Subcategory of ${cat.parentCategory.name})` : '(Main Category)'}
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
                  <p className="text-xs text-gray-500 mt-1">Primary category helps with URL structure and breadcrumbs</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="flex items-center h-full pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all"
                  />
                  <span className="text-sm text-gray-700">Publish immediately (visible to customers)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                    <FiTag className="h-3 w-3" />
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-600">
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Add a tag..."
                />
                <button type="button" onClick={handleAddTag} className="btn-secondary">
                  <FiPlus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Tags help customers find your products through search</p>
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
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Appears in product listings and search results</span>
                <span>{formData.shortDescription.length}/500 characters</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Long Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="longDescription"
                required
                rows="10"
                value={formData.longDescription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono text-sm"
                placeholder="Detailed description of the product. Supports HTML formatting."
              />
              <p className="text-xs text-gray-500 mt-1">Detailed product information for the product page</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-xs text-gray-500 mt-1">YouTube video will be embedded on the product page</p>
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

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-xs text-gray-500 mt-1">The price customers will pay</p>
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
                <p className="text-xs text-gray-500 mt-1">Your cost price (for profit calculation)</p>
              </div>
            </div>

            {formData.price && formData.buyPrice && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <FiInfo className="inline mr-1" />
                  Profit Margin: {(((formData.price - formData.buyPrice) / formData.price) * 100).toFixed(1)}% 
                  (${(formData.price - formData.buyPrice).toFixed(2)} profit per unit)
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Product Options</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    name="hasVariations"
                    checked={formData.hasVariations}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-700">This product has variations</p>
                    <p className="text-sm text-gray-500">Different sizes, models, or options with different prices</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    name="hasColors"
                    checked={formData.hasColors}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-700">This product has color variants</p>
                    <p className="text-sm text-gray-500">Different colors with their own images and SKUs</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Variations Tab */}
        {activeTab === 'variations' && (
          <div className="space-y-5">
            {!formData.hasVariations ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Enable variations in the Pricing tab first</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('pricing')}
                  className="mt-3 text-primary-600 hover:text-primary-700"
                >
                  Go to Pricing Tab →
                </button>
              </div>
            ) : (
              <>
                {/* Add Variation Form */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Add New Variation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                      type="text"
                      placeholder="SKU (optional)"
                      value={newVariation.sku}
                      onChange={(e) => setNewVariation({ ...newVariation, sku: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-primary-700 transition-all"
                    >
                      <FiPlus className="h-4 w-4" />
                      Add Variation
                    </button>
                  </div>
                </div>

                {/* Variations List */}
                {formData.variations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Existing Variations ({formData.variations.length})</h3>
                    {formData.variations.map((variation, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedVariationIndex(expandedVariationIndex === index ? null : index)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <FiPackage className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">{variation.name}</p>
                              <div className="flex gap-3 text-sm text-gray-500">
                                <span>Price: ${variation.price}</span>
                                {variation.buyPrice && <span>Cost: ${variation.buyPrice}</span>}
                                {variation.sku && <span className="font-mono">SKU: {variation.sku}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveVariation(index); }}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                            <FiChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedVariationIndex === index ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {expandedVariationIndex === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t bg-gray-50 p-4"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                                  <input
                                    type="text"
                                    value={variation.name}
                                    onChange={(e) => handleUpdateVariation(index, 'name', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                                  <input
                                    type="number"
                                    value={variation.price}
                                    onChange={(e) => handleUpdateVariation(index, 'price', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                    step="0.01"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost</label>
                                  <input
                                    type="number"
                                    value={variation.buyPrice}
                                    onChange={(e) => handleUpdateVariation(index, 'buyPrice', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                    step="0.01"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                                  <input
                                    type="text"
                                    value={variation.sku}
                                    onChange={(e) => handleUpdateVariation(index, 'sku', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded font-mono"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
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
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Enable colors in the Pricing tab first</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('pricing')}
                  className="mt-3 text-primary-600 hover:text-primary-700"
                >
                  Go to Pricing Tab →
                </button>
              </div>
            ) : (
              <>
                {/* Add Color Form */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Add New Color</h3>
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
                      type="text"
                      placeholder="SKU (optional)"
                      value={newColor.sku}
                      onChange={(e) => setNewColor({ ...newColor, sku: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-primary-700 transition-all"
                    >
                      <FiPlus className="h-4 w-4" />
                      Add Color
                    </button>
                  </div>
                </div>

                {/* Colors List with Images */}
                {formData.colors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Color Variants ({formData.colors.length})</h3>
                    {formData.colors.map((color, colorIndex) => (
                      <div key={colorIndex} className="border rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedColorIndex(expandedColorIndex === colorIndex ? null : colorIndex)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full border-2 shadow-sm"
                              style={{ backgroundColor: color.code }}
                            />
                            <div className="text-left">
                              <p className="font-medium">{color.name}</p>
                              <div className="flex gap-3 text-sm text-gray-500">
                                {color.sku && <span className="font-mono">SKU: {color.sku}</span>}
                                {color.images && <span>📷 {color.images.length} images</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveColor(colorIndex); }}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                            <FiChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedColorIndex === colorIndex ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {expandedColorIndex === colorIndex && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t bg-gray-50 p-4"
                            >
                              {/* Color Basic Info */}
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Color Name</label>
                                  <input
                                    type="text"
                                    value={color.name}
                                    onChange={(e) => handleUpdateColor(colorIndex, 'name', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                                  <input
                                    type="text"
                                    value={color.sku}
                                    onChange={(e) => handleUpdateColor(colorIndex, 'sku', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded font-mono"
                                  />
                                </div>
                              </div>
                              
                              {/* Color Images Section */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                  <FiCamera className="h-4 w-4" />
                                  Color Images
                                </h4>
                                
                                {/* Existing Color Images Grid */}
                                {color.images && color.images.length > 0 && (
                                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                                    {color.images.map((image, imgIndex) => (
                                      <div key={imgIndex} className="relative group">
                                        <img
                                          src={image.url}
                                          alt={`${color.name} ${imgIndex + 1}`}
                                          className="w-full h-24 object-cover rounded-lg border-2 group-hover:border-primary-500 transition-all"
                                        />
                                        {image.isMain && (
                                          <span className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded">
                                            Main
                                          </span>
                                        )}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                          <button
                                            type="button"
                                            onClick={() => handleSetMainColorImage(colorIndex, image._id)}
                                            className="bg-white text-primary-600 p-1 rounded-full hover:bg-primary-600 hover:text-white transition-all"
                                            title="Set as main"
                                          >
                                            <FiStar className="h-3 w-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveColorImage(colorIndex, image._id)}
                                            className="bg-white text-red-600 p-1 rounded-full hover:bg-red-600 hover:text-white transition-all"
                                            title="Remove"
                                          >
                                            <FiTrash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Upload New Images */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-all">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleColorImageUpload(colorIndex, e.target.files)}
                                    className="hidden"
                                    id={`colorUpload-${colorIndex}`}
                                    disabled={colorImageUploading === colorIndex}
                                  />
                                  <label
                                    htmlFor={`colorUpload-${colorIndex}`}
                                    className="cursor-pointer flex flex-col items-center"
                                  >
                                    {colorImageUploading === colorIndex ? (
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                    ) : (
                                      <>
                                        <FiPlusCircle className="h-8 w-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">Upload images for {color.name}</span>
                                        <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB each</span>
                                      </>
                                    )}
                                  </label>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            {/* Main Image */}
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
                <label htmlFor="mainImageInput" className="cursor-pointer flex flex-col items-center">
                  <FiUpload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload main image</span>
                  <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB. Recommended: 1200x1200px</span>
                </label>
              </div>
              {previewMainImage && (
                <div className="mt-3 relative w-32 h-32">
                  <img src={previewMainImage} alt="Main preview" className="w-full h-full object-cover rounded-lg shadow" />
                  <button
                    type="button"
                    onClick={() => removePreviewImage(0, true)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailImageChange}
                  className="hidden"
                  id="thumbnailImageInput"
                />
                <label htmlFor="thumbnailImageInput" className="cursor-pointer flex flex-col items-center">
                  <FiUpload className="h-8 w-8 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-600">Click to upload thumbnail</span>
                  <span className="text-xs text-gray-500">Used in listings and cards. Recommended: 300x300px</span>
                </label>
              </div>
              {formData.thumbnailImage?.url && (
                <div className="mt-3 relative w-20 h-20">
                  <img src={formData.thumbnailImage.url} alt="Thumbnail" className="w-full h-full object-cover rounded-lg shadow" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(existingImages.findIndex(img => img.type === 'thumbnail'), formData.thumbnailImage.publicId, 'thumbnail')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Hover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hover Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHoverImageChange}
                  className="hidden"
                  id="hoverImageInput"
                />
                <label htmlFor="hoverImageInput" className="cursor-pointer flex flex-col items-center">
                  <FiUpload className="h-8 w-8 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-600">Click to upload hover image</span>
                  <span className="text-xs text-gray-500">Shown on product card hover. Recommended: 500x500px</span>
                </label>
              </div>
              {formData.hoverImage?.url && (
                <div className="mt-3 relative w-20 h-20">
                  <img src={formData.hoverImage.url} alt="Hover" className="w-full h-full object-cover rounded-lg shadow" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(existingImages.findIndex(img => img.type === 'hover'), formData.hoverImage.publicId, 'hover')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Gallery Images with Drag & Drop */}
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
                <label htmlFor="galleryInput" className="cursor-pointer flex flex-col items-center">
                  <FiUpload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload gallery images</span>
                  <span className="text-xs text-gray-500">You can select multiple images. Drag to reorder</span>
                </label>
              </div>
            </div>

            {/* Existing Images Display */}
            {existingImages.filter(img => img.type === 'gallery' || img.type === 'main').length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Existing Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.filter(img => img.type !== 'thumbnail' && img.type !== 'hover').map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img.url} alt={`Existing ${index}`} className="w-full h-32 object-cover rounded-lg shadow" />
                      {img.isMain && (
                        <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">Main</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index, img.publicId, img.type)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                      >
                        <FiTrash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Gallery Previews with Drag & Drop */}
            {previewGalleryImages.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">New Images ({previewGalleryImages.length})</h3>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="gallery" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                      >
                        {previewGalleryImages.map((img, index) => (
                          <Draggable key={index} draggableId={`gallery-${index}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative group ${snapshot.isDragging ? 'opacity-50' : ''}`}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="absolute top-2 left-2 bg-gray-800 bg-opacity-50 text-white rounded p-1 cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                  <FiGripVertical className="h-3 w-3" />
                                </div>
                                <img src={img.url} alt={`Preview ${index}`} className="w-full h-32 object-cover rounded-lg shadow" />
                                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <input
                                    type="text"
                                    placeholder="Alt text"
                                    value={img.alt || ''}
                                    onChange={(e) => {
                                      const newPreviews = [...previewGalleryImages];
                                      newPreviews[index].alt = e.target.value;
                                      setPreviewGalleryImages(newPreviews);
                                    }}
                                    className="w-full text-xs bg-transparent text-white placeholder-gray-300 focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePreviewImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                                >
                                  <FiTrash2 className="h-3 w-3" />
                                </button>
                                <div className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-50 text-white text-xs px-1 rounded">
                                  {img.order}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                <p className="text-xs text-gray-500 mt-2">Drag images to reorder them</p>
              </div>
            )}
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="seo.metaTitle"
                    value={formData.seo.metaTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="SEO title (leave empty to use product name)"
                    maxLength="60"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Appears as the title in search results</span>
                    <span>{formData.seo.metaTitle?.length || 0}/60 characters</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    name="seo.metaDescription"
                    rows="3"
                    value={formData.seo.metaDescription}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="SEO description (leave empty to use short description)"
                    maxLength="160"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Brief description for search results</span>
                    <span>{formData.seo.metaDescription?.length || 0}/160 characters</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    name="metaKeywords"
                    value={metaKeywordInput}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="product, keywords, separated, by, commas"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated keywords relevant to your product</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Canonical URL
                  </label>
                  <input
                    type="url"
                    name="seo.canonicalUrl"
                    value={formData.seo.canonicalUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="https://example.com/canonical-url"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use the product URL</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open Graph Title (Facebook/LinkedIn)
                  </label>
                  <input
                    type="text"
                    name="seo.ogTitle"
                    value={formData.seo.ogTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="OG title (leave empty to use meta title)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open Graph Description
                  </label>
                  <textarea
                    name="seo.ogDescription"
                    rows="2"
                    value={formData.seo.ogDescription}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="OG description (leave empty to use meta description)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open Graph Image URL
                  </label>
                  <input
                    type="url"
                    name="seo.ogImage"
                    value={formData.seo.ogImage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="https://example.com/og-image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Image shown when sharing on social media</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Card Type
                  </label>
                  <select
                    name="seo.twitterCard"
                    value={formData.seo.twitterCard}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary with Large Image</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Preview</h3>
              {generatePreview()}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Review Statistics */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900">
                    {reviewsStats.averageRating.toFixed(1)}
                  </div>
                  <div className="mt-2">
                    {renderRatingStars(Math.round(reviewsStats.averageRating), "h-5 w-5")}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Based on {reviewsStats.totalReviews} reviews
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewsStats.distribution[star] || 0;
                    const percentage = reviewsStats.totalReviews > 0 
                      ? (count / reviewsStats.totalReviews) * 100 
                      : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <div className="w-12 text-sm text-gray-600">{star} star</div>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-gray-500">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {productReviews.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {productReviews.map((review, index) => (
                  <div key={review._id || index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{review.user?.name || 'Anonymous'}</p>
                          <div className="flex items-center gap-2">
                            {renderRatingStars(review.rating, "h-3 w-3")}
                            <span className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.verifiedPurchase && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    {review.title && (
                      <p className="font-medium text-gray-800 mt-2">{review.title}</p>
                    )}
                    <p className="text-gray-600 text-sm mt-1">{review.comment}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((img, imgIdx) => (
                          <img 
                            key={imgIdx}
                            src={img.url}
                            alt={`Review ${imgIdx}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FiStar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No reviews yet for this product</p>
              </div>
            )}
          </div>
        )}

        {/* Flags Tab */}
        {activeTab === 'flags' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <FiStar className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Featured Product</span>
                  </div>
                  <p className="text-sm text-gray-500">Display this product on the featured section of your homepage</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="checkbox"
                  name="isHotSale"
                  checked={formData.isHotSale}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <FiTrendingUp className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Hot Sale</span>
                  </div>
                  <p className="text-sm text-gray-500">Mark as trending/hot sale product to attract more customers</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="checkbox"
                  name="isTopRated"
                  checked={formData.isTopRated}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                  disabled
                />
                <div>
                  <div className="flex items-center gap-2">
                    <FiAward className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Top Rated</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formData.rating >= 4.5 
                      ? `✓ This product qualifies as Top Rated (Rating: ${formData.rating.toFixed(1)})`
                      : `Auto-updates when rating reaches 4.5 (Current: ${formData.rating.toFixed(1)})`}
                  </p>
                </div>
              </label>
            </div>

            {formData.rating >= 4.5 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-purple-700 flex items-center gap-2">
                  <FiAward className="h-5 w-5" />
                  This product qualifies as Top Rated! The badge will be shown automatically.
                </p>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-700 text-sm flex items-start gap-2">
                <FiInfo className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Flags help highlight your products on the storefront. Use them strategically to promote special products.</span>
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </form>
  );
};

export default ProductForm;