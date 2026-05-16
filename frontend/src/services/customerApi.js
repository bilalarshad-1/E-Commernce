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