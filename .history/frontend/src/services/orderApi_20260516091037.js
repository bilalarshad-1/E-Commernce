// services/orderApi.js
import api from './api';

export const orderService = {
  // Customer endpoints
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  requestReturn: (id, data) => api.post(`/orders/${id}/return`, data),
  downloadInvoice: (id) => api.get(`/orders/${id}/invoice`, { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  }),
  
  // Admin endpoints
  getAllOrders: (params) => api.get('/orders/admin/all', { params }),
  getOrderStats: () => api.get('/orders/admin/stats'),
  updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  processReturn: (id, data) => api.put(`/orders/${id}/return/process`, data),
};

export default orderService;