// ============================================
// src/pages/ShopPage.jsx - FIXED VERSION
// ============================================
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: '-createdAt'
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchCategories();
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from:', `${API_URL}/categories`);
      const response = await axios.get(`${API_URL}/categories`);
      console.log('Categories response:', response.data);
      
      // Handle different response structures
      let categoriesData = [];
      if (response.data.success && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Fetch categories error:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: 12,
        sort: filters.sort,
        status: 'active',
        isPublished: true
      };
      
      if (filters.category) {
        params.category = filters.category;
      }
      if (filters.minPrice) {
        params.minPrice = filters.minPrice;
      }
      if (filters.maxPrice) {
        params.maxPrice = filters.maxPrice;
      }
      
      console.log('Fetching products with params:', params);
      console.log('API URL:', `${API_URL}/products`);
      
      const response = await axios.get(`${API_URL}/products`, { params });
      console.log('Products response:', response.data);
      
      // Handle different response structures
      let productsData = [];
      let paginationData = { page: 1, pages: 1, total: 0 };
      
      if (response.data.success) {
        productsData = response.data.data || [];
        paginationData = response.data.pagination || { page: 1, pages: 1, total: 0 };
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
        paginationData = response.data.pagination || { page: 1, pages: 1, total: productsData.length };
      }
      
      setProducts(productsData);
      setPagination({
        page: paginationData.page || 1,
        pages: paginationData.pages || 1,
        total: paginationData.total || productsData.length
      });
      
      if (productsData.length === 0) {
        console.log('No products found in response');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Error: {error}</p>
          <button onClick={fetchProducts} className="mt-4 btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="md:w-64 space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">Categories</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <button
                onClick={() => handleFilterChange('category', '')}
                className={`w-full text-left px-3 py-2 rounded-md transition ${!filters.category ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category._id}
                  onClick={() => handleFilterChange('category', category.slug || category._id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition ${filters.category === (category.slug || category._id) ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Price Range</h3>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">{pagination.total} products found</p>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="-createdAt">Newest</option>
              <option value="-price">Price: High to Low</option>
              <option value="price">Price: Low to High</option>
              <option value="-sales">Best Selling</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-8 space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg ${pagination.page === pageNum ? 'bg-indigo-600 text-white' : 'border hover:bg-gray-100'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;