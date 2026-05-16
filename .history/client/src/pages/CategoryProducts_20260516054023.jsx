// pages/CategoryProducts.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiGrid, FiList, FiFilter } from 'react-icons/fi';
import { categoryService, productService } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import Loader from '../components/common/Loader';

const CategoryProducts = () => {
  const { slug } = useParams();
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sort: '-createdAt',
    minPrice: '',
    maxPrice: '',
  });

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery(
    ['category', slug],
    () => categoryService.getCategoryBySlug(slug).then(res => res.data.data)
  );

  // Fetch products in category
  const { data: productsData, isLoading: productsLoading } = useQuery(
    ['category-products', slug, filters],
    () => categoryService.getCategoryProducts(slug, { ...filters, limit: 12 }).then(res => res.data),
    { enabled: !!slug }
  );

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-rating', label: 'Top Rated' },
    { value: '-sales', label: 'Best Selling' },
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      sort: '-createdAt',
      minPrice: '',
      maxPrice: '',
    });
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Loader />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
            <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
            <Link to="/categories" className="btn-primary inline-flex items-center gap-2">
              <FiArrowLeft className="h-4 w-4" />
              Browse All Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="container mx-auto px-4">
          <Link to="/categories" className="inline-flex items-center gap-2 text-primary-100 hover:text-white mb-4">
            <FiArrowLeft className="h-4 w-4" />
            Back to Categories
          </Link>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {category.image?.url && (
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={category.image.url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-primary-100 max-w-2xl">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiFilter className="h-4 w-4" />
                Filters
              </button>
              
              <div className="flex items-center gap-2 border-l pl-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
                >
                  <FiGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
                >
                  <FiList className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600">
                {productsData?.pagination?.total || 0} products found
              </p>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Price
                  </label>
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Products Display */}
        {productsLoading ? (
          <Loader />
        ) : productsData?.data?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No products found in this category.</p>
          </div>
        ) : (
          <>
            <div className={`grid ${viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'grid-cols-1 gap-4'
            }`}>
              {productsData?.data?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {productsData?.pagination && productsData.pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => window.scrollTo(0, 0)}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;