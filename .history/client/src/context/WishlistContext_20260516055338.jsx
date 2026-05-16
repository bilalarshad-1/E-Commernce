// context/WishlistContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.jsx';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      loadLocalWishlist();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setWishlistCount(wishlist.length);
  }, [wishlist]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const response = await authService.getWishlist();
      setWishlist(response.data.data || []);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalWishlist = () => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Failed to parse wishlist:', error);
        setWishlist([]);
      }
    }
  };

  const saveLocalWishlist = (items) => {
    localStorage.setItem('wishlist', JSON.stringify(items));
    setWishlist(items);
  };

  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return false;
    }

    try {
      setLoading(true);
      const response = await authService.addToWishlist(productId);
      setWishlist(response.data.data);
      toast.success('Added to wishlist');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) {
      const newWishlist = wishlist.filter(item => item._id !== productId && item !== productId);
      saveLocalWishlist(newWishlist);
      toast.success('Removed from wishlist');
      return true;
    }

    try {
      setLoading(true);
      const response = await authService.removeFromWishlist(productId);
      setWishlist(response.data.data);
      toast.success('Removed from wishlist');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove from wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => {
      if (typeof item === 'object') {
        return item._id === productId;
      }
      return item === productId;
    });
  };

  const getWishlistCount = () => wishlistCount;

  const clearWishlist = () => {
    if (isAuthenticated) {
      wishlist.forEach(item => {
        removeFromWishlist(item._id || item);
      });
    } else {
      saveLocalWishlist([]);
    }
  };

  const value = {
    wishlist,
    loading,
    wishlistCount,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistCount,
    clearWishlist,
    loadWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};