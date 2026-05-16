// ============================================
// src/context/WishlistContext.jsx
// ============================================
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const { isAuthenticated, token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        setWishlistItems(JSON.parse(savedWishlist));
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers/wishlist`);
      setWishlistItems(response.data.data);
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  };

  const addToWishlist = async (product) => {
    if (isAuthenticated) {
      try {
        await axios.post(`${API_URL}/customers/wishlist/${product._id}`);
        setWishlistItems(prev => [...prev, product]);
        toast.success('Added to wishlist');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to add to wishlist');
      }
    } else {
      if (!wishlistItems.some(item => item._id === product._id)) {
        setWishlistItems(prev => [...prev, product]);
        toast.success('Added to wishlist');
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    if (isAuthenticated) {
      try {
        await axios.delete(`${API_URL}/customers/wishlist/${productId}`);
        setWishlistItems(prev => prev.filter(item => item._id !== productId));
        toast.success('Removed from wishlist');
      } catch (error) {
        toast.error('Failed to remove from wishlist');
      }
    } else {
      setWishlistItems(prev => prev.filter(item => item._id !== productId));
      toast.success('Removed from wishlist');
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item._id === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};