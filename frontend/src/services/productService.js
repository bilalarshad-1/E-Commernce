import api from './api';

export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getProductBySlug: (slug) => api.get(`/products/slug/${slug}`),
  getFeaturedProducts: (limit) => api.get('/products/featured', { params: { limit } }),
  getHotSaleProducts: (limit) => api.get('/products/hot-sale', { params: { limit } }),
  getTopRatedProducts: (limit) => api.get('/products/top-rated', { params: { limit } }),
  getProductsByCategory: (categoryId, params) => api.get(`/products/by-category/${categoryId}`, { params }),
};