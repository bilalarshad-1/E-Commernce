// services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.responseType === 'blob') {
      config.headers.Accept = 'application/pdf';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.responseType === 'blob') {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  registerFirst: (userData) => api.post('/auth/register-first', userData),
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.get('/auth/logout'),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
};

// User Services
export const userService = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  registerUser: (userData) => api.post('/auth/register', userData),
};

// Audit Log Services
export const auditService = {
  getAuditLogs: (params) => api.get('/audit-logs', { params }),
  getUserAuditLogs: (userId) => api.get(`/audit-logs/user/${userId}`),
};

// Product Services
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  updateStock: (id, data) => api.put(`/products/${id}/stock`, data),
  uploadImage: (id, imageData) => api.post(`/products/${id}/images`, imageData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (id, imageId) => api.delete(`/products/${id}/images/${imageId}`),
  getProductByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getProductStats: () => api.get('/products/stats/summary'),
  bulkAssignCategories: (data) => api.post('/products/bulk/categories', data),
  bulkUpdateFlags: (data) => api.put('/products/bulk/flags', data),
  getFeaturedProducts: (limit) => api.get('/products/featured', { params: { limit } }),
  getHotSaleProducts: (limit) => api.get('/products/hot-sale', { params: { limit } }),
  getTopRatedProducts: (limit) => api.get('/products/top-rated', { params: { limit } }),
};

// Category Services
export const categoryService = {
  getCategories: (params) => api.get('/categories', { params }),
  getCategory: (id) => api.get(`/categories/${id}`),
  getCategoryBySlug: (slug) => api.get(`/categories/slug/${slug}`),
  getCategoryTree: () => api.get('/categories/tree'),
  createCategory: (formData) => api.post('/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCategory: (id, formData) => api.put(`/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  getCategoryProducts: (id, params) => api.get(`/categories/${id}/products`, { params }),
};

export default api;