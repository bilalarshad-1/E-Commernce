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
    const token = localStorage.getItem('token');
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
// services/api.js - Add these new methods to productService

export const productService = {
  // Product CRUD
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Stock Management
  updateStock: (id, data) => api.put(`/products/${id}/stock`, data),
  
  // Image Management
  uploadImage: (id, imageData) => api.post(`/products/${id}/images`, imageData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (id, imageId) => api.delete(`/products/${id}/images/${imageId}`),
  
  // Barcode/QR - NEW METHODS
  getProductByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  
  // Get barcode image URL (for viewing)
  getBarcodeImageUrl: (id, options = {}) => {
    const { scale = 3, height = 10, includeText = true } = options;
    return `${api.defaults.baseURL}/products/${id}/barcode-image?scale=${scale}&height=${height}&includeText=${includeText}`;
  },
  
  // Get barcode download URL
  getBarcodeDownloadUrl: (id, options = {}) => {
    const { scale = 4, height = 12 } = options;
    return `${api.defaults.baseURL}/products/${id}/barcode-download?scale=${scale}&height=${height}`;
  },
  
  // Get QR code image URL (for viewing)
  getQRImageUrl: (id, options = {}) => {
    const { size = 300, margin = 2 } = options;
    return `${api.defaults.baseURL}/products/${id}/qr-image?size=${size}&margin=${margin}`;
  },
  
  // Get QR code download URL
  getQRDownloadUrl: (id, options = {}) => {
    const { size = 400 } = options;
    return `${api.defaults.baseURL}/products/${id}/qr-download?size=${size}`;
  },
  
  // Fetch barcode image as blob
  fetchBarcodeImage: async (id, options = {}) => {
    const url = productService.getBarcodeDownloadUrl(id, options);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch barcode');
    return response.blob();
  },
  
  // Fetch QR code image as blob
  fetchQRImage: async (id, options = {}) => {
    const url = productService.getQRDownloadUrl(id, options);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch QR code');
    return response.blob();
  },
  
  // Regenerate barcode
  regenerateBarcode: (id) => api.post(`/products/${id}/regenerate-barcode`),
  
  // Statistics
  getProductStats: () => api.get('/products/stats/summary'),
  
  // Bulk Operations
  bulkAssignCategories: (data) => api.post('/products/bulk/categories', data),
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