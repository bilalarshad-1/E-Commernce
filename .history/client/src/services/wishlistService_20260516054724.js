// services/wishlistService.js
import api from './api';

export const wishlistService = {
  getWishlist: () => api.get('/customers/wishlist'),
  addToWishlist: (productId) => api.post(`/customers/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/customers/wishlist/${productId}`),
};

export default wishlistService;