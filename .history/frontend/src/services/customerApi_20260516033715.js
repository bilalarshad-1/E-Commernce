// services/customerApi.js
import api from './api';

export const customerAdminService = {
  // Get all customers with filters
  getCustomers: (params) => api.get('/admin/customers', { params }),
  
  // Get single customer
  getCustomer: (id) => api.get(`/admin/customers/${id}`),
  
  // Update customer
  updateCustomer: (id, data) => api.put(`/admin/customers/${id}`, data),
  
  // Delete customer
  deleteCustomer: (id) => api.delete(`/admin/customers/${id}`),
  
  // Get customer audit logs
  getCustomerAuditLogs: (id, params) => api.get(`/admin/customers/${id}/audit-logs`, { params }),
  
  // Get customer statistics
  getCustomerStats: () => api.get('/admin/customers/stats/summary'),
  
  // Bulk actions
  bulkUpdateStatus: (customerIds, status) => api.post('/admin/customers/bulk/status', { customerIds, status }),
  bulkDelete: (customerIds) => api.post('/admin/customers/bulk/delete', { customerIds }),
};

export const customerService = {
  // Customer public endpoints
  register: (data) => api.post('/customers/register', data),
  login: (data) => api.post('/customers/login', data),
  verifyEmail: (token) => api.get(`/customers/verify-email/${token}`),
  resendVerification: (email) => api.post('/customers/resend-verification', { email }),
  forgotPassword: (email) => api.post('/customers/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/customers/reset-password/${token}`, { password }),
  
  // Customer protected endpoints (requires auth)
  changePassword: (data) => api.put('/customers/change-password', data),
  getProfile: () => api.get('/customers/profile'),
  updateProfile: (data) => api.put('/customers/profile', data),
  uploadProfileImage: (formData) => api.post('/customers/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  logout: () => api.get('/customers/logout'),
  getStats: () => api.get('/customers/stats'),
  
  // Address management
  addAddress: (data) => api.post('/customers/addresses', data),
  updateAddress: (addressId, data) => api.put(`/customers/addresses/${addressId}`, data),
  deleteAddress: (addressId) => api.delete(`/customers/addresses/${addressId}`),
  
  // Wishlist management
  getWishlist: () => api.get('/customers/wishlist'),
  addToWishlist: (productId) => api.post(`/customers/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/customers/wishlist/${productId}`),
};