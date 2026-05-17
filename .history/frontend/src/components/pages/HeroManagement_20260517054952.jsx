// pages/admin/HeroManagement.jsx
import React, { useState, useEffect } from 'react';
import { heroService } from '../../services/heroApi';
import { FiPlus, FiEdit2, FiTrash2, FiMove, FiEye, FiEyeOff } from 'react-icons/fi';

import toast from 'react-hot-toast';

const HeroManagement = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    buttonText: 'Shop Now',
    buttonUrl: '/shop',
    order: 0,
    isActive: true,
    bgImage: null
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await heroService.getHeroSlides();
      setSlides(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch hero slides');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'bgImage' && formData[key]) {
        formDataToSend.append(key, formData[key]);
      } else if (key !== 'bgImage') {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      if (editingSlide) {
        await heroService.updateHeroSlide(editingSlide._id, formDataToSend);
        toast.success('Hero slide updated successfully');
      } else {
        await heroService.createHeroSlide(formDataToSend);
        toast.success('Hero slide created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchSlides();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        await heroService.deleteHeroSlide(id);
        toast.success('Hero slide deleted successfully');
        fetchSlides();
      } catch (error) {
        toast.error('Failed to delete hero slide');
      }
    }
  };

  const handleToggleActive = async (slide) => {
    try {
      await heroService.updateHeroSlide(slide._id, { isActive: !slide.isActive });
      toast.success(`Slide ${!slide.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchSlides();
    } catch (error) {
      toast.error('Failed to update slide status');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedSlides = items.map((item, index) => ({
      id: item._id,
      order: index
    }));
    
    setSlides(items);
    
    try {
      await heroService.reorderHeroSlides(updatedSlides);
      toast.success('Order updated successfully');
    } catch (error) {
      toast.error('Failed to update order');
      fetchSlides();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      buttonText: 'Shop Now',
      buttonUrl: '/shop',
      order: slides.length,
      isActive: true,
      bgImage: null
    });
    setEditingSlide(null);
  };

  const openEditModal = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      buttonText: slide.buttonText,
      buttonUrl: slide.buttonUrl,
      order: slide.order,
      isActive: slide.isActive,
      bgImage: null
    });
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hero Section Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <FiPlus /> Add New Slide
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="hero-slides">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {slides.map((slide, index) => (
                  <Draggable key={slide._id} draggableId={slide._id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                      >
                        <div className="flex items-center p-4">
                          <div {...provided.dragHandleProps} className="cursor-move mr-4">
                            <FiMove className="text-gray-400" />
                          </div>
                          <div className="w-32 h-20 rounded overflow-hidden">
                            <img src={slide.bgImage.url} alt={slide.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 ml-4">
                            <h3 className="font-semibold">{slide.title}</h3>
                            <p className="text-sm text-gray-500">{slide.subtitle}</p>
                            <p className="text-xs text-gray-400">Order: {slide.order}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(slide)}
                              className={`p-2 rounded-lg transition-colors ${
                                slide.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={slide.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {slide.isActive ? <FiEye /> : <FiEyeOff />}
                            </button>
                            <button
                              onClick={() => openEditModal(slide)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => handleDelete(slide._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingSlide ? 'Edit Hero Slide' : 'Create New Hero Slide'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Button Text</label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Button URL</label>
                    <input
                      type="text"
                      value={formData.buttonUrl}
                      onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Background Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, bgImage: e.target.files[0] })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  {editingSlide && editingSlide.bgImage && !formData.bgImage && (
                    <p className="text-xs text-gray-500 mt-1">Current image: {editingSlide.bgImage.url.split('/').pop()}</p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingSlide ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroManagement;