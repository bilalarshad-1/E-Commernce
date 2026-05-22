import api from './api';

export const orderService = {
  // Customer endpoints
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  requestReturn: (id, data) => api.post(`/orders/${id}/return`, data),
  downloadInvoice: (id) => api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
  
  // Public endpoints
  validateCoupon: (data) => api.post('/orders/validate-coupon', data),
  getShippingMethods: () => api.get('/orders/shipping-methods'),
  calculateShippingAndTax: (data) => api.post('/orders/calculate', data),
};