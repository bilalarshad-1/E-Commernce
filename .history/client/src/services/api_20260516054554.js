// services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

// Auth Services (Includes Wishlist)
export const authService = {
  // Authentication
  register: (data) => api.post('/customers/register', data),
  login: (credentials) => api.post('/customers/login', credentials),
  getProfile: () => api.get('/customers/profile'),
  updateProfile: (data) => api.put('/customers/profile', data),
  changePassword: (data) => api.put('/customers/change-password', data),
  forgotPassword: (email) => api.post('/customers/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/customers/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/customers/verify-email/${token}`),
  resendVerification: (email) => api.post('/customers/resend-verification', { email }),
  logout: () => api.get('/customers/logout'),
  uploadProfileImage: (formData) => api.post('/customers/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStats: () => api.get('/customers/stats'),
  
  // Address Management
  addAddress: (data) => api.post('/customers/addresses', data),
  updateAddress: (addressId, data) => api.put(`/customers/addresses/${addressId}`, data),
  deleteAddress: (addressId) => api.delete(`/customers/addresses/${addressId}`),
  
  // Wishlist Management
  getWishlist: () => api.get('/customers/wishlist'),
  addToWishlist: (productId) => api.post(`/customers/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/customers/wishlist/${productId}`),
};

// Product Services
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: () => api.get('/products?isFeatured=true&limit=8'),
  getNewArrivals: () => api.get('/products?sort=-createdAt&limit=8'),
  getRelatedProducts: (categoryId, productId) => api.get(`/products?category=${categoryId}&limit=4`),
};

// Category Services
export const categoryService = {
  getCategories: (params) => api.get('/categories', { params }),
  getCategory: (id) => api.get(`/categories/${id}`),
  getCategoryBySlug: (slug) => api.get(`/categories/slug/${slug}`),
  getCategoryTree: () => api.get('/categories/tree'),
  getCategoryProducts: (slug, params) => {
    return api.get(`/categories/slug/${slug}`).then(res => {
      const categoryId = res.data.data._id;
      return api.get(`/categories/${categoryId}/products`, { params });
    });
  },
};

// Order Services
export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  requestReturn: (id, data) => api.post(`/orders/${id}/return`, data),
  downloadInvoice: (id) => api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
};

export default api;