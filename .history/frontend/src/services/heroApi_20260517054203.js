// services/heroApi.js
import api from './api';

export const heroService = {
  // Public
  getHeroSlides: () => api.get('/hero'),
  getHeroSlide: (id) => api.get(`/hero/${id}`),
  
  // Admin
  createHeroSlide: (formData) => api.post('/admin/hero', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateHeroSlide: (id, formData) => api.put(`/admin/hero/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteHeroSlide: (id) => api.delete(`/admin/hero/${id}`),
  reorderHeroSlides: (slides) => api.post('/admin/hero/reorder', { slides })
};

export default heroService;