// hooks/useWishlist.js
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import wishlistService from '../services/wishlistService';
import { useAuth } from './useAuth';

const useWishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Load wishlist from API or localStorage
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      loadLocalWishlist();
    }
  }, [isAuthenticated]);

  // Fetch wishlist from API
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await wishlistService.getWishlist();
      setWishlist(data.items || []);
      // Sync with localStorage for offline access
      localStorage.setItem('wishlist', JSON.stringify(data.items || []));
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load wishlist from localStorage for guest users
  const loadLocalWishlist = () => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  };

  // Save wishlist to localStorage
  const saveLocalWishlist = (items) => {
    localStorage.setItem('wishlist', JSON.stringify(items));
    setWishlist(items);
  };

  // Add to wishlist
  const addToWishlist = useCallback(async (product) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await wishlistService.addToWishlist(product._id);
        await fetchWishlist(); // Refresh wishlist
        toast.success(`${product.productName} added to wishlist`);
      } else {
        // Guest user - save to localStorage
        const exists = wishlist.some(item => item.productId === product._id);
        if (exists) {
          toast.error('Product already in wishlist');
          return;
        }
        
        const newWishlist = [...wishlist, {
          productId: product._id,
          productName: product.productName,
          productImage: product.mainImage?.url,
          price: product.price,
          originalPrice: product.price,
          _id: product._id
        }];
        
        saveLocalWishlist(newWishlist);
        toast.success(`${product.productName} added to wishlist`);
      }
    } catch (err) {
      toast.error('Failed to add to wishlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, wishlist, fetchWishlist]);

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (productId) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await wishlistService.removeFromWishlist(productId);
        await fetchWishlist(); // Refresh wishlist
        toast.success('Removed from wishlist');
      } else {
        // Guest user - remove from localStorage
        const newWishlist = wishlist.filter(item => item.productId !== productId);
        saveLocalWishlist(newWishlist);
        toast.success('Removed from wishlist');
      }
    } catch (err) {
      toast.error('Failed to remove from wishlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, wishlist, fetchWishlist]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId) => {
    return wishlist.some(item => item.productId === productId);
  }, [wishlist]);

  // Get wishlist count
  const getWishlistCount = useCallback(() => {
    return wishlist.length;
  }, [wishlist]);

  // Clear entire wishlist
  const clearWishlist = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await wishlistService.clearWishlist();
        setWishlist([]);
        localStorage.removeItem('wishlist');
        toast.success('Wishlist cleared');
      } else {
        saveLocalWishlist([]);
        toast.success('Wishlist cleared');
      }
    } catch (err) {
      toast.error('Failed to clear wishlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Sync local wishlist to server after login
  const syncWishlistAfterLogin = useCallback(async () => {
    const localWishlist = localStorage.getItem('wishlist');
    if (localWishlist && isAuthenticated) {
      const items = JSON.parse(localWishlist);
      for (const item of items) {
        try {
          await wishlistService.addToWishlist(item.productId);
        } catch (err) {
          console.error('Failed to sync item:', item.productId, err);
        }
      }
      // Clear local wishlist after sync
      localStorage.removeItem('wishlist');
      await fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  return {
    wishlist,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistCount,
    clearWishlist,
    syncWishlistAfterLogin,
    refreshWishlist: fetchWishlist
  };
};

export default useWishlist;