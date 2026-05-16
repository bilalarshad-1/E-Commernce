// pages/Categories.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { motion } from 'framer-motion';
import { FiFolder, FiChevronRight, FiImage } from 'react-icons/fi';
import { categoryService } from '../services/api';
import Loader from '../components/common/Loader';

const Categories = () => {
  const { data: categories, isLoading, error } = useQuery(
    'all-categories',
    () => categoryService.getCategories().then(res => res.data.data)
  );

  // Group categories by parent
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Build category tree
  const buildCategoryTree = (categories, parentId = null) => {
    return categories
      ?.filter(cat => cat.parentCategory === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(category => ({
        ...category,
        children: buildCategoryTree(categories, category._id)
      }));
  };

  const categoryTree = buildCategoryTree(categories);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-red-500">Failed to load categories</p>
          </div>
        </div>
      </div>
    );
  }

  const CategoryCard = ({ category }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories[category._id];

    return (
      <div className="border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow">
        {/* Category Image */}
        <Link to={`/category/${category.slug}`}>
          <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
            {category.image?.url ? (
              <img
                src={category.image.url}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <FiFolder className="h-12 w-12 text-gray-400" />
              </div>
            )}
            {category.isFeatured && (
              <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                Featured
              </span>
            )}
          </div>
        </Link>

        {/* Category Info */}
        <div className="p-4">
          <Link to={`/category/${category.slug}`}>
            <h3 className="font-semibold text-lg text-gray-900 hover:text-primary-600 transition-colors mb-1">
              {category.name}
            </h3>
          </Link>
          {category.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {category.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <Link
              to={`/category/${category.slug}`}
              className="text-primary-600 text-sm hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Shop Now
              <FiChevronRight className="h-4 w-4" />
            </Link>
            
            {hasChildren && (
              <button
                onClick={() => toggleExpand(category._id)}
                className="text-gray-500 text-sm hover:text-gray-700"
              >
                {isExpanded ? 'Hide Subcategories' : `View ${category.children.length} Subcategories`}
              </button>
            )}
          </div>

          {/* Subcategories */}
          {hasChildren && isExpanded && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Subcategories:</h4>
              <div className="grid grid-cols-2 gap-2">
                {category.children.map((subcat) => (
                  <Link
                    key={subcat._id}
                    to={`/category/${subcat.slug}`}
                    className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {subcat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CategoryListItem = ({ category, level = 0 }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories[category._id];

    return (
      <div className="border-b last:border-b-0">
        <div className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors`}>
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
            {category.image?.url ? (
              <img
                src={category.image.url}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <FiImage className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link to={`/category/${category.slug}`}>
                <h3 className="font-medium text-gray-900 hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
              </Link>
              {category.isFeatured && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  Featured
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-500 line-clamp-1">{category.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to={`/category/${category.slug}`}
              className="btn-secondary text-sm py-1 px-3"
            >
              Browse
            </Link>
            {hasChildren && (
              <button
                onClick={() => toggleExpand(category._id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiChevronRight className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-12 border-t bg-gray-50">
            {category.children.map((child) => (
              <CategoryListItem key={child._id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const featuredCategories = categories?.filter(cat => cat.isFeatured) || [];
  const mainCategories = categories?.filter(cat => !cat.parentCategory) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shop by Category</h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto">
            Explore our wide range of categories and find exactly what you're looking for
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Categories */}
        {featuredCategories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredCategories.map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CategoryCard category={category} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Categories - Grid View */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Categories</h2>
            <div className="flex gap-2">
              <button className="text-primary-600 text-sm">Grid View</button>
              <button className="text-gray-400 text-sm">List View</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainCategories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Category Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{categories?.length || 0}</p>
              <p className="text-sm text-gray-600">Total Categories</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {categories?.filter(c => c.isFeatured).length || 0}
              </p>
              <p className="text-sm text-gray-600">Featured Categories</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {categories?.filter(c => c.parentCategory).length || 0}
              </p>
              <p className="text-sm text-gray-600">Subcategories</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {categories?.filter(c => c.status === 'active').length || 0}
              </p>
              <p className="text-sm text-gray-600">Active Categories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;